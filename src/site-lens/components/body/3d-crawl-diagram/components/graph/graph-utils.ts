import * as THREE from 'three';

interface IGraphNode {
  id: number;
  url?: string;
  depth?: number;
  isOrphan?: boolean;
  collapsed?: boolean;
  childLinks?: IGraphLink[];
  urlId?: number;
  pageHealth?: number | null;
  issueCount?: number;
  status?: string;
  fx?: number;
  fy?: number;
  fz?: number;
  x?: number;
  y?: number;
  z?: number;
  __tickCount?: number;
  [key: string]: unknown;
}

interface IGraphLink {
  source: number | IGraphNode;
  target: number | IGraphNode;
  [key: string]: unknown;
}

export interface IGraphExportEventDetail {
  graphType: number;
  callback: () => void;
}

interface IOrphanClusterPosition {
  x: number;
  y: number;
  z?: number;
}

export const ORPHAN_CLUSTER_SPREAD = 30;
export const ORPHAN_MAIN_GAP = 150;
export const MIN_ORPHAN_OFFSET = 200;
export const DEFAULT_ORPHAN_OFFSET_2D = 600;
export const DEFAULT_ZOOM_TO_FIT_PADDING_2D = 220;
export const DEFAULT_ZOOM_TO_FIT_PADDING_3D = 350;

// Zoom-to-fit margin as a FRACTION of the smaller viewport axis rather than a fixed pixel pad.
// A fixed pad is a large share of a small canvas (graph reads tiny, marooned in empty space) and
// negligible on a large one (graph runs edge-to-edge), so the breathing room drifts with canvas
// and graph size. A ratio keeps it visually constant, matching the design prototype, which fits
// by a multiplicative factor (`min(W,H) / (2r * 1.12)`) instead of an absolute pad.
// Link styling matched to the design prototype, which tunes tone AND alpha per view:
//   2D canvas stroke — rgba(150,130,210,.22) dark / rgba(120,110,160,.22) light
//   3D LineBasicMaterial — slightly deeper vertex colours at opacity .24 dark / .42 light
// Links are deliberately faint: they are context, not content, so the nodes stay dominant.
export const LINK_BASE_COLOR_2D = {dark: '#9682D2', light: '#786EA0'};
export const LINK_BASE_COLOR_3D = {dark: '#9d8ac9', light: '#806BB3'};
export const LINK_BASE_OPACITY_2D = {dark: 0.35, light: 0.22};
export const LINK_BASE_OPACITY_3D = {dark: 1, light: 0.42};

/**
 * Base (unhighlighted) link colour for the current view.
 * @param {boolean} isDark - whether the dark theme is active
 * @param {boolean} is3D - true for the 3D crawl diagram, false for the 2D node cluster
 * @return {string} hex colour
 */
export const getLinkBaseColor = (isDark: boolean, is3D: boolean): string =>
  (is3D ? LINK_BASE_COLOR_3D : LINK_BASE_COLOR_2D)[isDark ? 'dark' : 'light'];

/**
 * Base (unhighlighted) link opacity for the current view.
 * @param {boolean} isDark - whether the dark theme is active
 * @param {boolean} is3D - true for the 3D crawl diagram, false for the 2D node cluster
 * @return {number} alpha in 0..1
 */
export const getLinkBaseOpacity = (isDark: boolean, is3D: boolean): number =>
  (is3D ? LINK_BASE_OPACITY_3D : LINK_BASE_OPACITY_2D)[isDark ? 'dark' : 'light'];

export const FIT_PADDING_RATIO_2D = 0.06;
export const FIT_PADDING_RATIO_3D = 0.1;
export const MIN_FIT_PADDING = 24;

/**
 * Viewport-relative zoom-to-fit padding, in px.
 * @param {number} viewportW - graph canvas width in px
 * @param {number} viewportH - graph canvas height in px
 * @param {number} ratio - fraction of the smaller axis to reserve as margin
 * @return {number} padding in px, floored at MIN_FIT_PADDING so tiny canvases still get a gap
 */
export const getFitPadding = (viewportW: number, viewportH: number, ratio: number): number =>
  Math.max(MIN_FIT_PADDING, Math.round(Math.min(viewportW || 0, viewportH || 0) * ratio));

// Zoom-button step for the 2D view. Zoom-out uses the exact inverse of zoom-in so an in→out
// round-trip lands back on the starting zoom; the previous 1.3 / 0.7 pair was not reciprocal
// (1/1.3 ≈ 0.769), so every round-trip drifted ~9% smaller and compounded.
// Matches the design prototype's 2D clamp (`zoomBy`: max(0.08, min(6, …))). Applied via the
// ForceGraph2D minZoom/maxZoom props so the WHEEL is bounded too, not just the +/- buttons.
export const ZOOM_STEP_2D = 1.3;
export const MIN_ZOOM_2D = 0.08;
export const MAX_ZOOM_2D = 6;

// 3D zoom is camera DISTANCE, so the relationship inverts: a smaller radius is further zoomed IN.
// The prototype clamps its orbit radius to [160, 1600] around a default of 820 — i.e. roughly
// 0.2x to 2x its outermost ring radius. Expressing the limits as ratios of OUR outer ring keeps
// the same proportions while staying correct at any link-length (our RING_RADIUS_BUCKETS match
// the prototype's `_ringR` exactly, so the scales line up).
export const ZOOM_STEP_3D = 1.3;
export const OUTER_RING_UNITS_3D = 7.6;
export const CAM_DISTANCE_MIN_RATIO_3D = 0.2;
export const CAM_DISTANCE_MAX_RATIO_3D = 2;

/**
 * Camera-distance limits for the 3D view, derived from the current ring scale.
 * @param {number} linkLengthValue - ring-radius unit currently driving the layout
 * @return {{min: number, max: number}} min (max zoom-in) and max (max zoom-out) camera distance
 */
export const getCameraDistanceLimits3d = (linkLengthValue: number): {min: number; max: number} => {
  const outerRing = OUTER_RING_UNITS_3D * (linkLengthValue || 1);
  return {
    min: outerRing * CAM_DISTANCE_MIN_RATIO_3D,
    max: outerRing * CAM_DISTANCE_MAX_RATIO_3D,
  };
};

/**
 * Clamp a 3D camera distance to the supported range.
 * @param {number} distance - desired camera distance from target
 * @param {number} linkLengthValue - ring-radius unit currently driving the layout
 * @return {number} distance clamped to the derived [min, max] band
 */
export const clampCameraDistance3d = (distance: number, linkLengthValue: number): number => {
  const {min, max} = getCameraDistanceLimits3d(linkLengthValue);
  return Math.min(max, Math.max(min, distance));
};

// Ceiling on how long the canvas stays masked while waiting for the force engine to report a stop.
// The mask exists to hide the settle-and-fit frames; if the engine never stops (very large graph,
// a cooldown that outlives it) the graph must still appear rather than sit behind a loader forever.
export const GRAPH_REVEAL_TIMEOUT_MS = 4000;

// How far the 2D framing centre is pulled from the composition's bounding-box centre toward the
// root. 0 = pure bbox centring (everything fits, but the root drifts off-centre once the orphan
// disc widens the box); 1 = pure root centring (root dead centre, far side clipped). A partial
// blend keeps the root close to centre while the zoom, measured about the blended centre, still
// guarantees nothing leaves the frame.
export const FRAME_ROOT_BIAS = 0.35;

/**
 * Axis-aligned bounds of every positioned node — the whole composition, main graph plus orphan
 * disc. Used instead of react-force-graph's zoomToFit so the centre and the zoom can be decided
 * separately (zoomToFit couples them, which is what forced the bbox-vs-root compromise).
 * @param {Array} nodes - graph nodes, settled
 * @return {{minX: number, maxX: number, minY: number, maxY: number} | null} bounds, or null if none
 */
export const getCompositionBounds2d = (
  nodes: {x?: number; y?: number}[],
): {minX: number; maxX: number; minY: number; maxY: number} | null => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  nodes.forEach(n => {
    if (n.x == null || n.y == null) return;
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  });
  if (minX === Infinity) return null;
  return {minX, maxX, minY, maxY};
};

// Breathing room applied to the geometry-derived initial fit — the prototype's `2 * r * 1.12`.
export const GEOMETRY_FIT_SLACK = 1.12;

/**
 * Initial 2D zoom derived from the layout's OWN geometry rather than from measured node positions.
 *
 * react-force-graph mounts at zoom 1 centred on the origin, but our rings sit out at
 * ~7.6 * linkLength units, so the first painted frames show a hugely magnified, off-centre graph
 * until a zoomToFit lands. Deriving the zoom from the known outer-ring radius lets us set the
 * correct framing on the very first frame — the same trick the design prototype uses in
 * `prewarm() -> _fitView()`, which is why it never shows a zoom jump.
 * @param {number} viewportW - canvas width in px
 * @param {number} viewportH - canvas height in px
 * @param {number} outerRadius - distance from origin to the outermost ring, in graph units
 * @return {number} zoom level, clamped to the supported 2D range
 */
export const getGeometryFitZoom2d = (
  viewportW: number,
  viewportH: number,
  outerRadius: number,
): number => {
  const span = 2 * Math.max(outerRadius, 1) * GEOMETRY_FIT_SLACK;
  return clampZoom2d(Math.min(viewportW || 0, viewportH || 0) / span);
};

/**
 * Clamp a 2D zoom level to the supported range.
 * @param {number} zoom - desired zoom level
 * @return {number} zoom clamped to [MIN_ZOOM_2D, MAX_ZOOM_2D]
 */
export const clampZoom2d = (zoom: number): number =>
  Math.min(MAX_ZOOM_2D, Math.max(MIN_ZOOM_2D, zoom));

export const getMainGraphBounds = (
  nodes: {isOrphan?: boolean; x?: number; y?: number; z?: number}[],
  is3D: boolean,
): {centerX: number; centerY: number; centerZ?: number; extent: number} | null => {
  const main = nodes.filter(
    (n): n is {isOrphan?: boolean; x: number; y: number; z?: number} =>
      !n.isOrphan && n.x != null && n.y != null,
  );
  if (main.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  main.forEach(n => {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
    if (is3D && n.z != null) {
      minZ = Math.min(minZ, n.z);
      maxZ = Math.max(maxZ, n.z);
    }
  });
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = is3D && minZ !== Infinity ? (minZ + maxZ) / 2 : undefined;
  const extentX = (maxX - minX) / 2;
  const extentY = (maxY - minY) / 2;
  const extentZ = is3D && minZ !== Infinity ? (maxZ - minZ) / 2 : 0;
  const extent =
    Math.sqrt(extentX * extentX + extentY * extentY + extentZ * extentZ) || 1;
  return {centerX, centerY, centerZ, extent};
};

export const getOrphanPositionFromBounds = (
  bounds: {centerX: number; centerY: number; centerZ?: number; extent: number},
  is3D: boolean,
): IOrphanClusterPosition => {
  const offset = bounds.extent + ORPHAN_MAIN_GAP;
  if (is3D) {
    const d = offset * 0.7;
    return {
      x: bounds.centerX + d,
      y: bounds.centerY,
      z: (bounds.centerZ ?? 0) + d,
    };
  }
  return {
    x: bounds.centerX + offset,
    y: bounds.centerY,
  };
};

export const getDefaultOrphanOffset = (
  linkLengthValue: number,
  mainNodeCount: number,
  is3D: boolean,
): IOrphanClusterPosition => {
  const base = Math.max(
    MIN_ORPHAN_OFFSET,
    linkLengthValue * 3 + Math.sqrt(Math.max(0, mainNodeCount)) * 15,
  );
  if (is3D) {
    const d = base * 0.7;
    return {x: d, y: 0, z: d};
  }
  return {x: base, y: 0};
};

/**
 * Disposes the geometry/material of an Object3D and all its descendants, without touching the
 * object graph itself. Safe to call repeatedly (dispose() is idempotent on Three.js resources).
 * @param {THREE.Object3D} root - the object subtree to release GPU resources for
 * @return {void}
 */
export const disposeObject3DTree = (root: THREE.Object3D): void => {
  root.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
      mesh.geometry.dispose();
    }
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) {
      material.forEach(m => m.dispose?.());
    } else if (material && typeof material.dispose === 'function') {
      material.dispose();
    }
  });
};

export const disposeForceGraph = (fg: unknown): void => {
  if (!fg || typeof fg !== 'object') return;
  const ref = fg as {
    pauseAnimation?: () => void;
    _destructor?: () => void;
    renderer?: () => {dispose?: () => void; forceContextLoss?: () => void} | null;
    scene?: () => THREE.Scene | null;
  };
  try {
    ref.pauseAnimation?.();
  } catch {
    // ignore
  }
  try {
    const scene = ref.scene?.();
    if (scene) disposeObject3DTree(scene);
  } catch {
    // ignore
  }
  try {
    const renderer = ref.renderer?.();
    renderer?.forceContextLoss?.();
    renderer?.dispose?.();
  } catch {
    // ignore
  }
  try {
    ref._destructor?.();
  } catch {
    // ignore
  }
};
