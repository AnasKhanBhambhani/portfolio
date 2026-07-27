import {useEffect, useRef, type MutableRefObject} from 'react';

const TWEEN_DURATION_MS = 600;

interface ILayoutTransitionNode {
  id: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

interface IUseLayoutTransitionParams {
  fgRef: MutableRefObject<any>;
  targetPositions: Map<number, {x: number; y: number; z?: number}> | null;
  getNodes: () => ILayoutTransitionNode[];
}

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/**
 * Animates into the fixed layout (radial fan in 2D, the spherical equivalent in 3D) by tweening
 * each node's fx/fy (and fz, when the target includes a z) from its current position to the newly
 * computed target over a fixed duration, writing plain numbers onto the existing node objects each
 * frame (no per-frame allocation). Does nothing when there are no target positions.
 * @param {IUseLayoutTransitionParams} params - fgRef, target positions, node getter
 * @return {void}
 */
export const useLayoutTransition = ({fgRef, targetPositions, getNodes}: IUseLayoutTransitionParams): void => {
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!targetPositions || !targetPositions.size) {
      return undefined;
    }

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const nodes = getNodes();
    if (!nodes.length) return undefined;

    const startPositions = new Map(nodes.map(node => [node.id, {x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0}]));
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / TWEEN_DURATION_MS);
      const eased = easeOutCubic(progress);

      for (const node of nodes) {
        const start = startPositions.get(node.id);
        const target = targetPositions.get(node.id);
        if (!start || !target) continue;
        const x = start.x + (target.x - start.x) * eased;
        const y = start.y + (target.y - start.y) * eased;
        // Write x/y directly, not just fx/fy: once the simulation has cooled down (cooldownTicks
        // exhausted), d3-force never ticks again, so nothing else copies fx/fy into the x/y
        // fields the canvas draw actually reads. fx/fy still pin the node against any stray tick.
        node.x = x;
        node.y = y;
        node.fx = x;
        node.fy = y;
        // z/fz only for 3D targets — 2D callers never pass a z, so this stays a no-op for them.
        if (target.z !== undefined) {
          const z = start.z + (target.z - start.z) * eased;
          node.z = z;
          node.fz = z;
        }
      }
      fgRef.current?.refresh?.();

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [targetPositions, getNodes, fgRef]);
};
