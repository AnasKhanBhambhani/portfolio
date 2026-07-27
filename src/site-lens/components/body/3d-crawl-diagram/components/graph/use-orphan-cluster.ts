import {useCallback, useEffect, type MutableRefObject} from 'react';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import type {TTheme} from '../../../../../types';

const isBrowser = () => typeof window !== 'undefined';

const getOrphanClusterBoundsFromNodes = (orphanNodes: any[]) => {
  if (orphanNodes.length === 0) return null;

  // Calculate bounding box from actual node positions
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  orphanNodes.forEach((n: any) => {
    const x = n.x ?? n.fx ?? 0;
    const y = n.y ?? n.fy ?? 0;
    const z = n.z ?? n.fz ?? 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  });

  // Calculate centroid
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Calculate radius to contain all nodes (with padding)
  let maxDistanceFromCenter = 0;
  orphanNodes.forEach((n: any) => {
    const x = n.x ?? n.fx ?? 0;
    const y = n.y ?? n.fy ?? 0;
    const z = n.z ?? n.fz ?? 0;
    const dx = x - centerX;
    const dy = y - centerY;
    const dz = z - centerZ;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    maxDistanceFromCenter = Math.max(maxDistanceFromCenter, distance);
  });

  const NODE_PADDING = 40;
  const radius = maxDistanceFromCenter + NODE_PADDING;

  return {centerX, centerY, centerZ, radius};
};

interface IUseOrphanClusterParams {
  orphanClusterRef: MutableRefObject<{sphere: THREE.Mesh | null; label: any | null}>;
  fgRef: MutableRefObject<any>;
  type: number;
  dataLoader: boolean;
  filteredGraphData: {nodes: any[]};
  hideOrphans: boolean;
  trackTimeout: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>;
  themeRef: MutableRefObject<TTheme>;
  linkLengthValue: number;
  expandToLevel: number;
}

/**
 * Manages the 3D orphan cluster bubble (sphere + label) in the force graph.
 * Creates, positions, and updates the visual grouping for orphan nodes.
 * @return {object} updateOrphanClusterPosition callback for engine tick/stop
 */
export const useOrphanCluster = ({
  orphanClusterRef,
  fgRef,
  type,
  dataLoader,
  filteredGraphData,
  hideOrphans,
  trackTimeout,
  themeRef,
  linkLengthValue,
  expandToLevel,
}: IUseOrphanClusterParams) => {
  // Helper to update orphan cluster sphere position from actual node positions
  const updateOrphanClusterPosition = useCallback(() => {
    if (!orphanClusterRef.current.sphere || !orphanClusterRef.current.label) return;

    const orphanNodes = filteredGraphData.nodes?.filter((n: any) => n.isOrphan) || [];
    if (orphanNodes.length === 0 || hideOrphans) return;

    const bounds = getOrphanClusterBoundsFromNodes(orphanNodes);
    if (!bounds) return;

    const {centerX, centerY, centerZ, radius} = bounds;

    // Update sphere position and scale
    orphanClusterRef.current.sphere.position.set(centerX, centerY, centerZ);
    // Update sphere geometry scale to match new radius
    const currentScale = radius / ((orphanClusterRef.current.sphere.geometry as THREE.SphereGeometry).parameters.radius || 1);
    orphanClusterRef.current.sphere.scale.set(currentScale, currentScale, currentScale);

    // Update label position (above the sphere)
    (orphanClusterRef.current.label as unknown as THREE.Object3D).position.set(
      centerX,
      centerY + radius + 20,
      centerZ,
    );
  }, [filteredGraphData.nodes, hideOrphans]);

  // Add yellow bubble ring around orphan cluster (3D only)
  useEffect(() => {
    if (!isBrowser() || type !== 4 || !fgRef.current || dataLoader || !filteredGraphData.nodes?.length) {
      return;
    }

    const addOrphanClusterBubble = () => {
      try {
        const scene = fgRef.current?.scene();
        if (!scene) {
          trackTimeout(addOrphanClusterBubble, 200);
          return;
        }

        // Remove existing orphan cluster objects
        if (orphanClusterRef.current.sphere) {
          scene.remove(orphanClusterRef.current.sphere);
          orphanClusterRef.current.sphere = null;
        }
        if (orphanClusterRef.current.label) {
          scene.remove(orphanClusterRef.current.label);
          orphanClusterRef.current.label = null;
        }

        // Count orphan nodes from the actual rendered data
        const orphanNodes = filteredGraphData.nodes.filter((n: any) => n.isOrphan);
        if (orphanNodes.length === 0 || hideOrphans) {
          return;
        }

        // Calculate cluster position from actual node positions (like 2D does)
        const bounds = getOrphanClusterBoundsFromNodes(orphanNodes);
        if (!bounds) return;

        const {centerX, centerY, centerZ, radius} = bounds;

        // Create orange bubble sphere - matching Graph2D style
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const sphereOpacity = themeRef.current === 'dark' ? 0.08 : 0.1; // Match Graph2D opacity
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0xFF9800, // Orange (#FF9800) - matching Graph2D
          transparent: true,
          opacity: sphereOpacity,
          side: THREE.DoubleSide,
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(centerX, centerY, centerZ);

        // Create orange wireframe ring - matching Graph2D stroke style
        const wireframeGeometry = new THREE.SphereGeometry(radius, 16, 16);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: 0xFF9800, // Orange (#FF9800) - matching Graph2D
          wireframe: true,
          transparent: true,
          opacity: 0.3, // Dashed line effect similar to Graph2D
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        sphere.add(wireframe);

        scene.add(sphere);
        orphanClusterRef.current.sphere = sphere;

        // Create label - matching Graph2D style
        const label = new SpriteText(`Orphan Pages (${orphanNodes.length})`);
        label.color = '#FF9800'; // Orange text - matching Graph2D
        label.textHeight = 9;
        label.fontWeight = 'bold';
        label.backgroundColor = themeRef.current === 'dark' ? 'rgba(26, 27, 31, 0.9)' : '#ffffff'; // White background for light theme
        label.padding = 5;
        label.borderRadius = 4;
        (label as unknown as THREE.Object3D).position.set(centerX, centerY + radius + 20, centerZ);
        (label as unknown as THREE.Object3D).renderOrder = 1000;

        scene.add(label);
        orphanClusterRef.current.label = label;
      } catch (e) {
        console.warn('Error adding orphan cluster bubble:', e);
      }
    };

    // Wait for graph to be ready, then add bubble
    const timeoutId = setTimeout(() => {
      let attempts = 0;
      const maxAttempts = 20;
      const intervalId = setInterval(() => {
        attempts++;
        try {
          const scene = fgRef.current?.scene();
          if (scene && scene.children && scene.children.length > 0) {
            clearInterval(intervalId);
            addOrphanClusterBubble();
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
          }
        } catch (e) {
          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
          }
        }
      }, 150);
    }, 800);

    return () => {
      clearTimeout(timeoutId);
      try {
        const currentFgRef = fgRef.current;
        const currentOrphanCluster = orphanClusterRef.current;
        if (currentFgRef) {
          const scene = currentFgRef.scene();
          if (scene) {
            if (currentOrphanCluster.sphere) {
              scene.remove(currentOrphanCluster.sphere);
            }
            if (currentOrphanCluster.label) {
              scene.remove(currentOrphanCluster.label);
            }
          }
        }
      } catch (e) {
        console.error('Ignore cleanup errors:', e);
      }
    };
  }, [type, dataLoader, filteredGraphData.nodes?.length, hideOrphans]);

  // Update orphan cluster position when settings change (3D only)
  // This ensures the sphere follows the nodes when link length, depth, etc. change
  useEffect(() => {
    if (type !== 4 || !orphanClusterRef.current.sphere) return;

    // Update immediately, then again after a short delay to catch any position changes
    updateOrphanClusterPosition();
    const timeoutId = setTimeout(() => {
      updateOrphanClusterPosition();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [type, linkLengthValue, expandToLevel, updateOrphanClusterPosition]);

  return {updateOrphanClusterPosition};
};
