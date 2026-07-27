import {type MutableRefObject} from 'react';
import * as THREE from 'three';
import {useStableCallback} from '@/utils/hooks/useStableCallback';

const NODE_SPHERE_SHININESS = 80;
const NODE_SPHERE_SPECULAR = 0x555555;

// On-screen size anchor for zoom-invariant node labels. stableOnRenderFramePost rescales each label
// to `baseScale * cameraDistance / REFERENCE`, which under perspective projection yields a constant
// on-screen height of `baseScale / REFERENCE` (the cameraDistance cancels) — so this value is a pure
// absolute-size knob, NOT a real camera distance: SMALLER ⇒ bigger labels.
//
// Calibrated from real projection math (not guessed). A sprite of world height `baseScaleY` projects
// to screenPx = (baseScaleY / REFERENCE) * viewportH / (2·tan(fov/2)). With fov=50° (three's default
// PerspectiveCamera, unset by this stack) and viewportH≈graphHeight (600), the projection constant
// viewportH/(2·tan(25°)) ≈ 643. Labels carry baseScaleY = textSize + 4 (SpriteText adds 2*padding,
// padding=2). At REFERENCE=360 this yields on-screen heights matching the confirmed-good 2D font px
// (depth0 9/360*643≈16px, depth1 7.3/360*643≈13px, depth2 6.2/360*643≈11px). The previous 120 made
// labels ~3× too large once the rescale actually began firing.
const NODE_LABEL_REFERENCE_DISTANCE = 360;

/**
 * three-forcegraph always builds the default node sphere as a MeshLambertMaterial with
 * transparent:true hardcoded (regardless of our opacity config) and no depthWrite override,
 * which reads as washed-out/see-through. Swap it for an opaque, specular-lit material so nodes
 * look solid and read as rounded 3D surfaces under the scene's default lighting.
 * @param {THREE.MeshLambertMaterial} material - the library's default node sphere material
 * @return {THREE.MeshPhongMaterial} an opaque, specular-lit replacement material
 */
const upgradeNodeSphereMaterial = (material: THREE.MeshLambertMaterial): THREE.MeshPhongMaterial =>
  new THREE.MeshPhongMaterial({
    color: material.color.clone(),
    transparent: false,
    depthWrite: true,
    shininess: NODE_SPHERE_SHININESS,
    specular: new THREE.Color(NODE_SPHERE_SPECULAR),
  });

interface IUseEngineCallbacksParams {
  fgRef: MutableRefObject<any>;
  type: number;
  filteredGraphData: {nodes: any[]};
  graphDataKey: string;
  hideOrphans: boolean;
  searchNodeId: number;
  orphanClusterRef: MutableRefObject<{sphere: any; label: any}>;
  stabilizedPositionsRef: MutableRefObject<Map<number, {x: number; y: number; z?: number}>>;
  positionsStabilizedRef: MutableRefObject<boolean>;
  currentDataKeyRef: MutableRefObject<string>;
  nodesFixOnDragRef: MutableRefObject<boolean>;
  updateOrphanClusterPosition: () => void;
  /**
   * Fits the 2D graph to the viewport. Called once per data set from onEngineStop so the fit is
   * measured against FINAL node positions (deterministic) rather than a mid-settle snapshot.
   */
  onGraphSettled: () => void;
}

/**
 * Stable ForceGraph engine callbacks for tick, stop, render, and position update events.
 * Uses useStableCallback so identity never changes but closure is always fresh.
 * @return {object} Engine callback functions for ForceGraph props
 */
export const useEngineCallbacks = ({
  fgRef,
  type,
  filteredGraphData,
  graphDataKey,
  hideOrphans,
  searchNodeId,
  orphanClusterRef,
  stabilizedPositionsRef,
  positionsStabilizedRef,
  currentDataKeyRef,
  nodesFixOnDragRef,
  updateOrphanClusterPosition,
  onGraphSettled,
}: IUseEngineCallbacksParams) => {
  const stableOnEngineTick = useStableCallback(() => {
    if (type === 4 && orphanClusterRef.current.sphere) {
      const tickCount = (fgRef.current as any).__tickCount || 0;
      (fgRef.current as any).__tickCount = tickCount + 1;
      if (tickCount % 10 === 0) {
        updateOrphanClusterPosition();
      }
    }
  });

  const stableOnEngineStop3d = useStableCallback(() => {
    if (fgRef.current && filteredGraphData.nodes) {
      filteredGraphData.nodes.forEach((node: any) => {
        if (node.x !== undefined && node.y !== undefined) {
          stabilizedPositionsRef.current.set(node.id, {
            x: node.x,
            y: node.y,
            z: node.z,
          });
        }
      });
      positionsStabilizedRef.current = true;
      currentDataKeyRef.current = graphDataKey;
      // The 3D orphan grid that used to be written here is gone, mirroring the 2D removal:
      // computeSphericalLayout now packs orphans into their own ball (computeOrphanBall) as part of
      // the deterministic layout pass, so there is a single authority and the positions actually
      // render. The orphan bubble still needs repositioning against those new coordinates.
      if (filteredGraphData.nodes.some((n: any) => n.isOrphan) && !hideOrphans) {
        updateOrphanClusterPosition();
      }
      onGraphSettled();
    }
  });

  const stableOnRenderFramePost = useStableCallback(() => {
    if (!fgRef.current) return;
    const scene = fgRef.current.scene?.();
    if (!scene) return;
    const nodeGroup = scene.children?.find((g: any) => g.type === 'Group');
    if (!nodeGroup) return;

    // Camera + scratch vector for the constant-screen-size label rescale below. Fetched once per
    // frame; react-force-graph/3d-force-graph exposes the active camera via .camera(), same as
    // .scene() above. labelWorldPos is reused across labels to avoid per-frame allocations.
    const camera = fgRef.current.camera?.();
    const cameraPos: THREE.Vector3 | undefined = camera?.position;
    const labelWorldPos = new THREE.Vector3();

    const hasActiveSearch = searchNodeId !== undefined && searchNodeId !== -1;
    for (const obj of nodeGroup.children) {
      if (obj.__graphObjType !== 'node' || !obj.__data) continue;

      if (obj.material?.type === 'MeshLambertMaterial') {
        const oldMaterial = obj.material;
        obj.material = upgradeNodeSphereMaterial(oldMaterial);
        oldMaterial.dispose();
      }

      // Keep each node's label sprite (tagged in createNodeLabel) at a constant on-screen size by
      // counter-scaling its base scale by its distance from the camera. Only depth<=2 nodes carry a
      // label, so this touches a small, bounded set. Labels are nested inside the per-node group, so
      // traverse the node's subtree to reach them regardless of nesting depth.
      if (cameraPos) {
        obj.traverse((child: any) => {
          if (child.userData?.isNodeLabel) {
            const distance = cameraPos.distanceTo(child.getWorldPosition(labelWorldPos));
            const factor = distance / NODE_LABEL_REFERENCE_DISTANCE;
            child.scale.set(child.userData.baseScaleX * factor, child.userData.baseScaleY * factor, 1);
          }
        });
      }

      if (hasActiveSearch && obj.__data.id === searchNodeId) {
        const customGroup = obj?.children?.[0];
        if (customGroup?.traverse) {
          customGroup.traverse((child: any) => {
            if (child?.material && 'depthTest' in child.material) {
              child.material.depthTest = false;
            }
          });
        }
      }
    }
  });

  const stableNodePositionUpdate3d = useStableCallback((nodeObj: any, coords: { x: number; y: number; z: number }, node: any) => {
    if (positionsStabilizedRef.current && currentDataKeyRef.current === graphDataKey && nodesFixOnDragRef.current) {
      const storedPos = stabilizedPositionsRef.current.get(node.id);
      if (storedPos && (node.fx === undefined || node.fx === null)) {
        node.fx = storedPos.x;
        node.fy = storedPos.y;
        if (storedPos.z !== undefined) {
          node.fz = storedPos.z;
        }
      }
    }
  });

  const stableOnEngineStop2d = useStableCallback(() => {
    if (fgRef.current && filteredGraphData.nodes) {
      // Only the FIRST settle of a given data set should reframe the view. Later engine stops
      // (e.g. a reheat after dragging a node) must leave the user's manual zoom/pan alone.
      const isNewDataSet = currentDataKeyRef.current !== graphDataKey;
      filteredGraphData.nodes.forEach((node: any) => {
        if (node.x !== undefined && node.y !== undefined) {
          stabilizedPositionsRef.current.set(node.id, {
            x: node.x,
            y: node.y,
          });
        }
      });
      positionsStabilizedRef.current = true;
      currentDataKeyRef.current = graphDataKey;
      // NOTE: the 2D orphan grid that used to be written here has been removed. It set fx/fy only,
      // and on a cooled simulation nothing copies fx -> x, so it never affected what was drawn —
      // the rendered orphan positions came from the spanning tree, which is exactly why they sat
      // among the main graph's rings. computeRadialLayout now owns orphan placement (see
      // computeOrphanDisc), giving a single authority and positions that actually render.
      if (isNewDataSet) {
        onGraphSettled();
      }
    }
  });

  const stableNodePositionUpdate2d = useStableCallback((node: any) => {
    if (positionsStabilizedRef.current && currentDataKeyRef.current === graphDataKey && nodesFixOnDragRef.current) {
      const storedPos = stabilizedPositionsRef.current.get(node.id);
      if (storedPos && (node.fx === undefined || node.fx === null)) {
        node.fx = storedPos.x;
        node.fy = storedPos.y;
      }
    }
  });

  return {
    stableOnEngineTick,
    stableOnEngineStop3d,
    stableOnRenderFramePost,
    stableNodePositionUpdate3d,
    stableOnEngineStop2d,
    stableNodePositionUpdate2d,
  };
};
