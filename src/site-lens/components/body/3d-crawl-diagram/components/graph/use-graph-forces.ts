import {useEffect, type MutableRefObject} from 'react';
import {reportError} from '@/shared/error-boundary';

const isBrowser = () => typeof window !== 'undefined';

interface IUseGraphForcesParams {
  fgRef: MutableRefObject<any>;
  type: number;
  depthNodesData: {nodes: any[]};
  filteredGraphData: {nodes: any[]};
}

/**
 * Strips d3-force's default charge/link forces for both 3D and 2D graph modes — both always use a
 * fixed, deterministic layout (computeSphericalLayout / computeRadialLayout + useLayoutTransition,
 * which pin every node's fx/fy/fz), so the running simulation would otherwise keep recomputing
 * charge/link every tick for positions that are already overridden by the fixed layout.
 * Polls until the graph ref is ready.
 */
export const useGraphForces = ({
  fgRef,
  type,
  depthNodesData,
  filteredGraphData,
}: IUseGraphForcesParams) => {
  // Force configuration for 3D graph.
  // 3D has no force-directed layout option — it ALWAYS uses the single deterministic spherical
  // layout (computeSphericalLayout + useLayoutTransition, which pin every node's fx/fy/fz). So the
  // only thing to do here is strip the library's default charge/link forces, otherwise d3-force
  // would keep computing them every tick for positions that are already overridden by the fixed
  // layout. The camera framing for 3D is set elsewhere (index.tsx handles view fitting).
  useEffect(() => {
    if (!isBrowser() || type !== 4 || !depthNodesData.nodes?.length) {
      return;
    }

    const disableForces = () => {
      if (!fgRef.current || typeof fgRef.current.d3Force !== 'function') {
        return false;
      }
      try {
        fgRef.current.d3Force('charge', null);
        // Neutralise the link force instead of removing it. d3-force's forceLink is
        // what rewrites every link's `source`/`target` from raw ids into real node
        // object references (forceLink.initialize) — and three-forcegraph needs those
        // resolved objects to position and stretch each link. Deleting the force with
        // d3Force('link', null) also deleted that resolution step, so whenever this
        // poll happened to fire before the engine had initialised the force, links
        // stayed as bare ids, their geometry was never stretched off unit scale, and
        // every line silently vanished — the intermittent "no lines" bug. Zero
        // strength keeps the same "contributes nothing to the fixed layout" intent
        // while leaving id resolution intact.
        const linkForce = fgRef.current.d3Force('link');
        // Not created yet — keep polling rather than reporting success, otherwise we
        // stop before ever neutralising it.
        if (!linkForce) return false;
        if (typeof linkForce.strength === 'function') linkForce.strength(0);
        return true;
      } catch (e) {
        reportError(e, {section: 'graph-3d-force-config'});
        return false;
      }
    };

    // Poll until graph is ready. react-force-graph re-creates its default forces whenever the
    // graph data changes, so re-running on data change (via the deps) re-strips them each time.
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      if (disableForces() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [type, depthNodesData.nodes?.length, filteredGraphData.nodes]);

  // Force configuration for 2D graph. 2D has no force-directed layout option either — it ALWAYS
  // uses the fixed radial-fan layout (computeRadialLayout + useLayoutTransition), so every node
  // already gets an explicit target position. Just strip the running forces entirely instead of
  // letting d3-force keep computing charge/link every tick for positions that get overridden
  // anyway; the fixed layout already places orphans, so there's no recluster step here.
  useEffect(() => {
    if (!isBrowser() || type !== 5 || !depthNodesData.nodes?.length) {
      return;
    }

    const disableForces = () => {
      if (!fgRef.current || typeof fgRef.current.d3Force !== 'function') {
        return false;
      }
      try {
        fgRef.current.d3Force('charge', null);
        // Neutralise the link force instead of removing it. d3-force's forceLink is
        // what rewrites every link's `source`/`target` from raw ids into real node
        // object references (forceLink.initialize) — and three-forcegraph needs those
        // resolved objects to position and stretch each link. Deleting the force with
        // d3Force('link', null) also deleted that resolution step, so whenever this
        // poll happened to fire before the engine had initialised the force, links
        // stayed as bare ids, their geometry was never stretched off unit scale, and
        // every line silently vanished — the intermittent "no lines" bug. Zero
        // strength keeps the same "contributes nothing to the fixed layout" intent
        // while leaving id resolution intact.
        const linkForce = fgRef.current.d3Force('link');
        // Not created yet — keep polling rather than reporting success, otherwise we
        // stop before ever neutralising it.
        if (!linkForce) return false;
        if (typeof linkForce.strength === 'function') linkForce.strength(0);
        return true;
      } catch (e) {
        reportError(e, {section: 'graph-2d-force-config'});
        return false;
      }
    };

    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      if (disableForces() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [type, depthNodesData.nodes?.length, filteredGraphData.nodes]);
};
