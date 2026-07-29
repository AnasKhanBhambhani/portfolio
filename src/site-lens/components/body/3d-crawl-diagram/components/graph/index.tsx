import {observer} from 'mobx-react';
import classNames from 'classnames';
import React, {
  useContext,
  useRef,
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import {useStableCallback} from '@/utils/hooks/useStableCallback';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import MyContext from '../context';
import {Loader2} from 'lucide-react';
import {ThinkingLoader} from '@/components/common-components/components/thinking-loader';
import {linkgraphDomains} from '@/utils/router';
import {EmptyState} from '@/shared/ui/composed/empty-state';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faPlus, faMinus,
  faArrowsToDot,
  faXmark,
} from '@fortawesome/pro-regular-svg-icons';
import * as d3 from 'd3-scale';
import {useSiteLensDepthData} from '../../../../../hooks/use-site-lens-depth-data';
import {getLocalStorageItem, setLocalStorageItem} from '@/utils/safe-localStorage';
import {WATERMARK_CONFIG} from '@/utils/watermark';
import {reportError} from '@/shared/error-boundary';
import {sanitizeUrl} from '@/shared/security';
import type {IGraphProps, TTheme} from '../../../../../types';
import type {IDepthLink, IDepthNode} from '@/modules/site-audit/v1/api.types';
import {MAX_SCALE, COLOR_OPTIONS, METRICS} from '../../../../../constants';
import {getDefaultMaxDepthForGraph, getDynamicLinkLength, getNodeBackendId, metricValuePassesRange} from '../../../../../functions';
import {
  ORPHAN_CLUSTER_SPREAD,
  DEFAULT_ORPHAN_OFFSET_2D,
  FIT_PADDING_RATIO_2D,
  FIT_PADDING_RATIO_3D,
  getFitPadding,
  getCompositionBounds2d,
  FRAME_ROOT_BIAS,
  getGeometryFitZoom2d,
  getLinkBaseColor,
  getLinkBaseOpacity,
  ZOOM_STEP_2D,
  MIN_ZOOM_2D,
  MAX_ZOOM_2D,
  clampZoom2d,
  ZOOM_STEP_3D,
  clampCameraDistance3d,
  getCameraDistanceLimits3d,
  disposeForceGraph,
  disposeObject3DTree,
  getDefaultOrphanOffset,
  getMainGraphBounds,
  type IGraphExportEventDetail,
} from './graph-utils';
import {generateStarPositions, getStarfieldRadiusRange} from './graph-starfield';
import {lightenColor, getColorByValue, getNodeColorBySummary, NO_DATA_COLOR} from './graph-color-utils';
import {computeRadialLayout, computeSphericalLayout, buildSpanningTree, getEndpointId, getRingRadius} from './graph-layouts';
import {getSelectionHighlightSet, isLinkHighlighted, type ISelectionLink} from './graph-selection-utils';
import {useLayoutTransition} from './use-layout-transition';
import {
  getZoomBtnClass,
  ZOOM_CONTAINER_CLASS,
  getCanvasShellClass,
  LEFT_OVERLAY_STACK_CLASS,
  LEGEND_WRAP_CLASS,
  getLegendWrapThemeClass,
  getLegendTitleClass,
  getLegendItemLabelClass,
  getDetailDrawerWrapClass,
  getDetailDrawerPanelClass,
  getDetailStatTileClass,
} from './graph-tailwind';
import {GraphSettingsPanel} from './graph-settings-panel';
import {useGraphForces} from './use-graph-forces';
import {useOrphanCluster} from './use-orphan-cluster';
import {useEngineCallbacks} from './use-engine-callbacks';

interface IColorLegendItem {
  color: string;
  label: string;
}

interface IColorLegendData {
  title: string;
  items: IColorLegendItem[];
}

// Every gradient metric (pageHealth and the rest) is banded into the same solid red/amber/green
// thresholds by getColorByValue/getBandColor, so every legend below shows all 3 bands to match.
const getColorLegendData = (colorBy: string, colorByLabel: string): IColorLegendData | null => {
  if (!colorBy || colorBy === 'default') return null;

  if (colorBy === 'pageHealth') {
    return {
      title: 'Proficiency',
      items: [
        {color: '#27AE60', label: 'Strong (700-1000)'},
        {color: '#F1AA3E', label: 'Growing (300-699)'},
        {color: '#E74C3C', label: 'Learning (0-299)'},
      ],
    };
  }

  if (colorBy === 'indexable') {
    return {
      title: 'Status',
      items: [
        {color: '#27AE60', label: 'Active'},
        {color: '#E74C3C', label: 'Archived'},
      ],
    };
  }

  return {
    title: colorByLabel,
    items: [
      {color: '#27AE60', label: 'High'},
      {color: '#F1AA3E', label: 'Medium'},
      {color: '#E74C3C', label: 'Low'},
    ],
  };
};

const DEFAULT_NODE_RGB: [number, number, number] = [148, 148, 148];

// react-force-graph defaults `nodeLabel` to the string 'name' when the prop is omitted, which
// silently shows the library's own native hover tooltip (node.name). Passing this stable no-op
// accessor explicitly suppresses it — our own hover card (built separately) is the only tooltip.
const emptyNodeLabel = () => '';

// Stable empty highlight set reused whenever no node is selected, so the memoized highlight value
// keeps a constant identity (a fresh `new Set()` each render would needlessly re-run downstream memos).
const EMPTY_HIGHLIGHT_SET: Set<number> = new Set();

// How much the selection dims links/nodes that fall outside the highlighted branch, matching the
// magnitude already used for the filter/search de-emphasis feature so the two dimming reasons agree.
// Values match the reference design's own per-view dimming (2D canvas: 0.12, 3D/WebGL: 0.08).
const SELECTION_DIM_OPACITY_2D = 0.12;
const SELECTION_DIM_OPACITY_3D = 0.08;

// Hover info-card positioning: cursor offset and estimated card size used only for viewport clamping.
// How long the canvas may go WITHOUT a simulation tick before we treat the layout as finished and
// FRAME the graph (centre + zoom). Idle watchdog, not a deadline: every tick restarts it, so
// framing waits for the layout to actually settle before measuring the composition.
const GRAPH_SETTLE_IDLE_MS = 600;
// Absolute cap: frame the graph by this point no matter what, even if the engine never ticks
// (fully-pinned layout) or never fires onEngineStop.
const GRAPH_SETTLE_HARD_CAP_MS = 2500;

const HOVER_CARD_CURSOR_OFFSET = 14;
const HOVER_CARD_EST_WIDTH = 220;
const HOVER_CARD_EST_HEIGHT = 64;

/**
 * Derives the short title shown for a node: the last non-empty path segment of node.url, or 'index'
 * for the root. Mirrors the plain-text label derivation used for the 3D SpriteText and 2D canvas
 * labels; kept as a small isolated helper for the hover card so those two are left untouched.
 * @param {IDepthNode} node - a graph node with an optional `url`
 * @return {string} the slug/title text
 */
const getNodeUrlSlug = (node: IDepthNode): string => {
  const url = node?.url ?? '';
  const urlMatch = url.match(/^https?:\/\/(?:www\.)?([^/]+)(?:\/(.*))?$/);
  const pathString = urlMatch?.[2] ?? '';
  const pathParts = pathString.split('/').filter((part: string) => part.length > 0);
  return pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'index';
};

/**
 * Parses a node color (hex #rrggbb or rgb()/rgba() string, both used across colorBy modes)
 * into [r, g, b] so 2D canvas node drawing can build rgba() glow/highlight colors from it.
 * @param {string} color - the node's fill color, as returned by calculateNodeColour
 * @return {[number, number, number]} parsed RGB components (0-255 each)
 */
const parseColorToRgb = (color: string): [number, number, number] => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) {
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  return DEFAULT_NODE_RGB;
};

// Force graph libraries are loaded inside the component via useEffect so that
// the first render shows a skeleton instead of crashing on a null import.
type TForceGraphComponent = React.ComponentType<Record<string, unknown>>;

interface IOrbitControlsLike {
  autoRotate: boolean;
  autoRotateSpeed: number;
  target?: THREE.Vector3;
  update: () => void;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

// Matches the mockup's manual rotation rate (theta += 0.0013 rad/frame). OrbitControls.update()
// with no deltaTime arg rotates by (2*PI/3600) * autoRotateSpeed per call, so autoRotateSpeed
// must be ~0.75 to land on the same 0.0013 rad/frame at 60fps.
const AUTO_ROTATE_SPEED = 0.75;
const GRAPH_ROTATION_CENTER = {x: 0, y: 0, z: 0};

// Matches the mockup's `setTimeout(..., 2500)` in `_bind()`'s mouseup handler: after a node is
// deselected, auto-rotate stays paused briefly before resuming, instead of snapping back instantly.
const ROTATE_RESUME_DELAY_MS = 2500;

// Slowly-rotating starfield background for the 3D view. Values mirror the reference prototype:
// 900 points on a spherical shell, a small screen-constant purple point sprite (sizeAttenuation
// off so stars don't shrink with depth), theme-aware color/opacity.
const STAR_COUNT = 900;
const STAR_SIZE = 2.4;
const STAR_COLOR_DARK = 0x9c8fd0;
const STAR_COLOR_LIGHT = 0xb7abe0;
const STAR_OPACITY_DARK = 0.5;
const STAR_OPACITY_LIGHT = 0.18;

// Per-frame Y-axis increment for the starfield background. Matches the reference prototype's
// absolute value (~1/6th of the graph's own 0.0013 rad/frame auto-rotate) for a subtle parallax.
const STARFIELD_ROTATION_SPEED = 0.0002;

// Small bezier bow on 2D links (mockup's "tree" links use a comparable subtle curve rather than
// straight lines). 0 = straight; 1 ≈ a semicircle. react-force-graph-2d renders this natively.
const LINK_CURVATURE_2D = 0.12;

// Node glow: a camera-facing sprite behind each node, tinted to the node's own color, matching
// 2D's canvas radial-gradient halo. The texture is a plain white-to-transparent radial gradient,
// baked once and reused for every node — per-node color comes from tinting the sprite material,
// not from regenerating the texture.
const NODE_GLOW_TEXTURE_SIZE = 128;
const NODE_GLOW_DIAMETER_MULTIPLIER = 2.2; // sprite width/height = baseSize * this — kept small so non-hovered nodes don't wash out into big halos
const NODE_GLOW_HOVER_MULTIPLIER = 3; // hover/select scatters a bigger, brighter glow (applied on top of the idle diameter)
// The root node's body is an OPAQUE, hard-edged disc, whereas every other node's body is a
// translucent, soft-edged sprite the glow shines THROUGH (so the glow reads as the node itself
// lighting up). The root's glow can therefore only ever show as a halo OUTSIDE its disc, so with the
// shared multipliers it looked like a thin rim when idle and an oversized detached aura when hovered.
// The root gets its own diameters instead: a larger idle halo so it reads as a glow, and a gentler
// hover halo so it stays proportional to the disc. (These are eyeball-tuned — safe to nudge.)
const ROOT_GLOW_DIAMETER_MULTIPLIER = 3.2; // idle: radius ≈ 1.6·baseSize vs the 1.0·baseSize disc → a clear halo
const ROOT_GLOW_HOVER_DIAMETER_MULTIPLIER = 5.2; // hover: radius ≈ 2.6·baseSize — visible boost, but not the 3.3· aura the shared 6.6 gave
/**
 * Glow sprite diameter multiplier (× baseSize) for a node, branching on whether it is the opaque
 * root disc and whether it is currently hovered/selected. Centralised so nodeThreeObject (initial
 * build) and updateNodeHighlight (in-place hover patch) never drift out of sync.
 * @param {boolean} isRoot - true for the depth-0 root node (opaque disc body)
 * @param {boolean} isHighlighted - true when the node is hovered or click-selected
 * @return {number} the sprite scale multiplier to apply to baseSize
 */
export const getGlowDiameterMultiplier = (isRoot: boolean, isHighlighted: boolean): number => {
  if (isRoot) return isHighlighted ? ROOT_GLOW_HOVER_DIAMETER_MULTIPLIER : ROOT_GLOW_DIAMETER_MULTIPLIER;
  return isHighlighted ? NODE_GLOW_DIAMETER_MULTIPLIER * NODE_GLOW_HOVER_MULTIPLIER : NODE_GLOW_DIAMETER_MULTIPLIER;
};
let nodeGlowTexture: THREE.Texture | null = null;
const getNodeGlowTexture = (): THREE.Texture => {
  if (nodeGlowTexture) return nodeGlowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = NODE_GLOW_TEXTURE_SIZE;
  canvas.height = NODE_GLOW_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  const center = NODE_GLOW_TEXTURE_SIZE / 2;
  if (ctx) {
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, NODE_GLOW_TEXTURE_SIZE, NODE_GLOW_TEXTURE_SIZE);
  }
  nodeGlowTexture = new THREE.CanvasTexture(canvas);
  return nodeGlowTexture;
};

// Node body: replaces the library's default opaque, hard-edged sphere with a semi-transparent,
// soft-edged circular sprite (camera-facing, tinted to the node's own color) — a flat core opacity
// out to most of the radius, then feathered to 0 at the very edge, so the silhouette reads as a
// soft circle rather than a crisp geometric border.
const NODE_BODY_TEXTURE_SIZE = 128;
const NODE_BODY_CORE_OPACITY = 0.8;
const NODE_BODY_CORE_RADIUS_RATIO = 0.7; // fraction of the radius that stays at full core opacity before feathering
const NODE_BODY_DIAMETER_MULTIPLIER = 2; // sprite width/height = baseSize * this — matches the old sphere's visual footprint
let nodeBodyTexture: THREE.Texture | null = null;
const getNodeBodyTexture = (): THREE.Texture => {
  if (nodeBodyTexture) return nodeBodyTexture;
  const canvas = document.createElement('canvas');
  canvas.width = NODE_BODY_TEXTURE_SIZE;
  canvas.height = NODE_BODY_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  const center = NODE_BODY_TEXTURE_SIZE / 2;
  if (ctx) {
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${NODE_BODY_CORE_OPACITY})`);
    gradient.addColorStop(NODE_BODY_CORE_RADIUS_RATIO, `rgba(255, 255, 255, ${NODE_BODY_CORE_OPACITY})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, NODE_BODY_TEXTURE_SIZE, NODE_BODY_TEXTURE_SIZE);
  }
  nodeBodyTexture = new THREE.CanvasTexture(canvas);
  return nodeBodyTexture;
};
let rootNodeBodySphereGeometry: THREE.SphereGeometry | null = null;
const getRootNodeBodySphereGeometry = (): THREE.SphereGeometry => {
  if (rootNodeBodySphereGeometry) return rootNodeBodySphereGeometry;
  rootNodeBodySphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  return rootNodeBodySphereGeometry;
};

let ForceGraph2D: TForceGraphComponent | null = null;
let ForceGraph3D: TForceGraphComponent | null = null;
let forceGraphLoadPromise: Promise<void> | null = null;

const loadForceGraphLibs = (): Promise<void> => {
  if (forceGraphLoadPromise) return forceGraphLoadPromise;
  if (typeof window === 'undefined') return Promise.resolve();
  forceGraphLoadPromise = Promise.all([
    import('react-force-graph-2d'),
    import('react-force-graph-3d'),
  ])
    .then(([m2D, m3D]) => {
      ForceGraph2D = m2D.default as unknown as TForceGraphComponent;
      ForceGraph3D = m3D.default as unknown as TForceGraphComponent;
    })
    .catch(error => {
      forceGraphLoadPromise = null;
      reportError(error, {section: 'force-graph-load'});
      throw error;
    });
  return forceGraphLoadPromise;
};

export const Graph = observer(({type, theme, showWatermark, watermarkLogoUrl, selectedPageIds, filterMode = 'deemphasize', showPrunable = false, hideOrphans = false, metricRanges, metricBounds}: IGraphProps) => {
  const {depthNodesGraph, loadingDepthNodes} = useSiteLensDepthData();

  const {deviceInfo} = useContext(MyContext);
  const [nodesFixOnDrag, setNodesFixOnDrag] = useState<boolean>(false);
  const nodeSizeValue = 1;
  const [linkLengthValue, setLinkLengthValue] = useState<number>(115);
  const [linkWidth, setLinkWidth] = useState(1.5);
  // Base link alpha, matched to the design prototype (see getLinkBaseOpacity). Links are meant to
  // read as faint context behind the nodes; the previous flat 1.0 made them compete with the nodes.
  const linkOpacityValue = getLinkBaseOpacity(theme === 'dark', type === 4);
  const [color2xx, setColor2xx] = useState<string>('#12B76A');
  const [linkColor, setLinkColor] = useState(getLinkBaseColor(true, false));
  const [nonIndexableNodeColour, setNonIndexableNodeColour] = useState('#6ff038');
  const [sizeBy, setSizeBy] = useState('depth');
  const [colorBy, setColorBy] = useState<string>('pageHealth');
  const [selectedNodeDetail, setSelectedNodeDetail] = useState<IDepthNode | null>(null);
  // Tracks whether auto-rotate was paused by a selection, so the resume effect below can tell a
  // deselect (needs the ROTATE_RESUME_DELAY_MS pause) apart from initial mount (resumes instantly).
  const hadSelectionRef = useRef(false);
  // Live handles for the imperative auto-rotate pause/resume helpers (3D only) — see the effects
  // and click handlers that use them further down.
  const rotationControlsRef = useRef<IOrbitControlsLike | null>(null);
  const rotationResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedNodeDetailRef = useRef<IDepthNode | null>(null);
  // const [searchError, setSearchError] = useState('');
  const [depthNodesData, setDepthNodesData] = useState({nodes: [], links: []});
  const [nodesById, setNodesById] = useState({});
  const [rootNodeId, setRootNodeId] = useState(null);
  const [isData, setIsData] = useState(false);
  const [maxDepthValue, setMaxDepthValue] = useState(null);
  const [expandToLevel, setExpandToLevel] = useState(0);
  // const [prev, setPrev] = useState(0);
  const [searchNodeId, setSearchNodeId] = useState(-1);
  // Node currently under the cursor (full object, or null when the mouse is off all nodes). Drives a
  // hover-only branch-highlight preview; click-selection (searchNodeId) always takes priority over it.
  const [hoveredNode, setHoveredNode] = useState<IDepthNode | null>(null);
  // Mirrors hoveredNode.id, read (not subscribed to) by nodeThreeObject. Keeping hover out of
  // nodeThreeObject's dependency array is deliberate: three-forcegraph clears and rebuilds every
  // node's THREE object whenever the nodeThreeObject function reference changes (see
  // node_modules/three-forcegraph — nodeDataMapper.clear() on nodeThreeObject prop change), which
  // was stalling the auto-rotate animation frame on every hover. Hover-driven label highlighting
  // is applied directly to just the affected node(s) instead — see updateNodeHighlight.
  const hoveredNodeIdRef = useRef<number | null>(null);
  // Whether the cursor is currently over the graph canvas. react-force-graph reports hover from a
  // throttled requestAnimationFrame raycast against the LAST pointer position, and the underlying
  // three-render-objects never resets that position on pointer-leave — so after a fast move-and-exit
  // it can fire a hover-IN for a node the cursor has already left, re-applying a highlight our
  // onMouseLeave just cleared. handleNodeHover consults this flag to drop such stale hover-ins.
  const isPointerInsideCanvasRef = useRef<boolean>(false);
  // Holds the latest updateNodeHighlight (defined further down, after createNodeLabel) so
  // handleNodeHover — declared earlier for readability — can call it without a temporal-dead-zone
  // ordering issue. Kept current via the effect right after updateNodeHighlight's definition.
  const updateNodeHighlightRef = useRef<(nodeId: number) => void>(() => {});
  // Mirrors highlightSet (the branch-highlight-preview useMemo below, which also depends on
  // hoveredNode). Read by nodeThreeObject instead of the reactive value for the same reason as
  // hoveredNodeIdRef — highlightSet was ALSO in nodeThreeObject's dependency array, so hovering
  // still forced a full node-object rebuild via this second path even after hoveredNode was
  // removed. Kept in sync by the effect right after highlightSet's own useMemo.
  const highlightSetRef = useRef<Set<number>>(new Set());
  // Viewport-clamped cursor position (client coords) for the hover info-card. Null when nothing is
  // hovered or before the first mousemove; the card only renders when both this and hoveredNode are set.
  const [hoverCardPos, setHoverCardPos] = useState<{x: number; y: number} | null>(null);
  const [dataLoader, setDataLoader] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [graphWidth, setGraphWidth] = useState<number>(1083);
  const [graphHeight, setGraphHeight] = useState<number>(600);
  const settleWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleHardCapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameSettledGraphRef = useRef<() => void>(() => {});
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  // OTTO-1710: load ForceGraph libraries inside an effect so React knows when
  // they resolve. State trigger replaces the previous unguarded module-level
  // dynamic import, which produced a race-condition blank render on first paint.
  const [forceGraphsReady, setForceGraphsReady] = useState<boolean>(
    ForceGraph2D !== null && ForceGraph3D !== null,
  );

  useEffect(() => {
    if (forceGraphsReady) return;
    if (typeof window === 'undefined') return;
    let mounted = true;
    loadForceGraphLibs()
      .then(() => {
        if (mounted) setForceGraphsReady(true);
      })
      .catch(() => {
        // reportError already called inside loadForceGraphLibs
      });
    return () => {
      mounted = false;
    };
  }, [forceGraphsReady]);

  // LPS-351: centralised timeout tracking. Every setTimeout inside this
  // component (including FocusGraph closure) registers its id here, and the
  // unmount cleanup clears any pending timers so callbacks cannot fire on an
  // unmounted component.
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const trackTimeout = useCallback(
    (cb: () => void, ms: number): ReturnType<typeof setTimeout> => {
      const id = setTimeout(() => {
        timeoutsRef.current.delete(id);
        cb();
      }, ms);
      timeoutsRef.current.add(id);
      return id;
    },
    [],
  );
  const clearTrackedTimeout = useCallback(
    (id: ReturnType<typeof setTimeout> | null | undefined): void => {
      if (!id) return;
      clearTimeout(id);
      timeoutsRef.current.delete(id);
    },
    [],
  );
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(id => clearTimeout(id));
      timeoutsRef.current.clear();
    };
  }, []);

  // Refs for colors to avoid callback recreation on theme/color changes
  const color2xxRef = useRef(color2xx);
  const linkColorRef = useRef(linkColor);
  const nonIndexableNodeColourRef = useRef(nonIndexableNodeColour);
  const themeRef = useRef(theme);
  const nodesFixOnDragRef = useRef(nodesFixOnDrag);

  useEffect(() => {
    color2xxRef.current = color2xx;
  }, [color2xx]);

  useEffect(() => {
    linkColorRef.current = linkColor;
  }, [linkColor]);

  useEffect(() => {
    nonIndexableNodeColourRef.current = nonIndexableNodeColour;
  }, [nonIndexableNodeColour]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    nodesFixOnDragRef.current = nodesFixOnDrag;
  }, [nodesFixOnDrag]);

  // Measure container width and update on resize.
  //
  // useLayoutEffect (not useEffect) on purpose: graphWidth/graphHeight start as 1083x600
  // placeholders, and a layout effect runs after DOM commit but BEFORE the browser paints, so the
  // measured size is applied in the same frame. With useEffect the first paint showed the graph at
  // the placeholder size and it then visibly resized once the real measurement landed.
  // Falls back to useEffect on the server, where there is no layout to measure.
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    if (dataLoader || !depthNodesData.nodes?.length) {
      return;
    }

    const updateSize = () => {
      if (canvasWrapperRef.current) {
        const {width, height} = canvasWrapperRef.current.getBoundingClientRect();
        if (width > 0) {
          setGraphWidth(Math.floor(width));
        }
        if (height > 0) {
          setGraphHeight(Math.floor(height));
        }
      }
    };

    // Measure as early as possible. The previous version also re-measured on a 100ms timer "in case
    // layout is still settling", which produced a second visible re-render; the ResizeObserver below
    // already covers any later layout change, so the timer was redundant churn.
    // Measure synchronously inside the layout effect so the real size is applied before the first
    // paint. The rAF is a follow-up for the case where the container has not been laid out yet
    // (e.g. it was display:none at commit time); the ResizeObserver below covers everything later.
    updateSize();
    const rafId = requestAnimationFrame(updateSize);

    // The 100ms "in case layout is still settling" re-measure that used to live here was removed:
    // it fired a second state update after the graph had already painted, which read as an extra
    // visible re-render. The ResizeObserver handles any later layout change on its own.
    const pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const {width, height} = entry.contentRect;
        if (width > 0) {
          setGraphWidth(Math.floor(width));
        }
        if (height > 0) {
          setGraphHeight(Math.floor(height));
        }
      }
    });

    if (canvasWrapperRef.current) {
      resizeObserver.observe(canvasWrapperRef.current);
    }

    window.addEventListener('resize', updateSize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTrackedTimeout(pendingTimeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [dataLoader, depthNodesData.nodes?.length, trackTimeout, clearTrackedTimeout]);

  // Theme color definitions
  const getThemeColors = (currentTheme: TTheme) => {
    switch (currentTheme) {
      case 'light':
        return {
          bg: '#f5f5f5',
          cardBg: '#ffffff',
          inputBg: '#e8e8e8',
          text: '#1a1a1a',
          textMuted: '#666666',
          border: '#d9d9d9',
          nodeColor: '#12B76A',
          nonIndexableColor: '#F04438',
          // Select colors
          selectBg: '#fff',
          selectText: '#121212',
          selectBorder: '#E8E8E8',
          selectArrow: '#4E5156',
          selectPlaceholder: '#A3A4A4',
        };
      case 'dark':
      default:
        return {
          bg: '#24262A',
          cardBg: '#2f3134',
          inputBg: '#444648',
          text: '#ffffff',
          textMuted: '#a0a0a0',
          border: '#444648',
          nodeColor: '#12B76A',
          nonIndexableColor: '#F04438',
          // Select colors
          selectBg: '#444648',
          selectText: '#fff',
          selectBorder: 'transparent',
          selectArrow: '#fff',
          selectPlaceholder: '#a0a0a0',
        };
    }
  };

  const themeColors = React.useMemo(() => getThemeColors(theme), [theme]);

  // Update colors when theme changes. `type` is a dependency too: the prototype uses a slightly
  // deeper link tone in 3D than in 2D, so switching views must re-derive the link colour.
  useEffect(() => {
    setColor2xx(themeColors.nodeColor);
    setLinkColor(getLinkBaseColor(theme === 'dark', type === 4));
    setNonIndexableNodeColour(themeColors.nonIndexableColor);
  }, [theme, type]);

  const nodePassesMetricFilters = useCallback((node: any) => {
    if (!metricRanges || !metricBounds) return true;

    for (const metric of METRICS) {
      const value = node[metric.key] as number | null | undefined;
      if (!metricValuePassesRange(value, metricRanges[metric.key], metricBounds[metric.key])) {
        return false;
      }
    }

    return true;
  }, [metricRanges, metricBounds]);

  const filteredGraphData = useMemo(() => {
    let nodes = depthNodesData.nodes;
    let links = depthNodesData.links;
    if (hideOrphans) {
      nodes = nodes.filter((node: any) => !node.isOrphan);
      const filteredNodeIds = new Set(nodes.map((n: any) => n.id));
      links = links.filter((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      });
    }
    if (filterMode === 'remove') {
      nodes = nodes.filter((node: any) => {
        let passesPageSelection = true;
        if (selectedPageIds && selectedPageIds.size > 0) {
          const nodeBackendId = getNodeBackendId(node);
          passesPageSelection = selectedPageIds.has(nodeBackendId);
        }
        const passesMetrics = nodePassesMetricFilters(node);
        return passesPageSelection && passesMetrics;
      });
      const filteredNodeIds = new Set(nodes.map((n: any) => n.id));
      links = links.filter((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      });
    }

    return {nodes, links};
  }, [depthNodesData, selectedPageIds, filterMode, hideOrphans, nodePassesMetricFilters]);

  const graphDataKey = useMemo(() => {
    const nodes = depthNodesData.nodes;
    const links = depthNodesData.links;
    // Use count + first/last IDs as a lightweight fingerprint instead of joining all IDs
    const firstNodeId = nodes.length > 0 ? nodes[0].id : 0;
    const lastNodeId = nodes.length > 0 ? nodes[nodes.length - 1].id : 0;
    return `data-${nodes.length}-${links.length}-${firstNodeId}-${lastNodeId}`;
  }, [depthNodesData]);

  const graphKey = useMemo(() => {
    return `graph-${graphDataKey}`;
  }, [graphDataKey]);

  // Canonical spanning tree of the currently-rendered (filtered) graph, used to resolve a selected
  // node's parent + full downstream subtree for branch highlighting. Recomputed only when the
  // filtered node/link set changes.
  const spanningTree = useMemo(
    () => buildSpanningTree(filteredGraphData.nodes, filteredGraphData.links),
    [filteredGraphData],
  );

  // The set of node ids in the highlighted branch (itself + parent edge + subtree). A click-selection
  // (searchNodeId) always wins; hovering only previews a branch when nothing is click-selected.
  // Empty (stable identity) whenever neither is active, so link/node rendering is untouched then.
  const highlightSet = useMemo(() => {
    const effectiveHighlightId = searchNodeId !== -1 ? searchNodeId : (hoveredNode?.id ?? -1);
    if (effectiveHighlightId == null || effectiveHighlightId === -1) return EMPTY_HIGHLIGHT_SET;
    return getSelectionHighlightSet(effectiveHighlightId, spanningTree.parentOf, spanningTree.childrenOf);
  }, [searchNodeId, hoveredNode, spanningTree]);

  const isNodeDeemphasized = useCallback((node: any) => {
    if (filterMode !== 'deemphasize') return false;
    let passesPageSelection = true;
    if (selectedPageIds && selectedPageIds.size > 0) {
      const nodeBackendId = getNodeBackendId(node);
      passesPageSelection = selectedPageIds.has(nodeBackendId);
    }
    const passesMetrics = nodePassesMetricFilters(node);
    return !(passesPageSelection && passesMetrics);
  }, [selectedPageIds, filterMode, nodePassesMetricFilters]);


  const getSettings = () => {
    const latestSettings = getLocalStorageItem('site_visualization_settings') && getLocalStorageItem('site_visualization_settings') !== 'undefined' ? JSON.parse(getLocalStorageItem('site_visualization_settings')) : {};
    Object.keys(latestSettings).forEach((key: string) => {
      if (key === 'sizeBy') {
        setSizeBy(latestSettings[key]);
      } else if (key === 'colorBy') {
        const colorByValue = latestSettings[key];
        // Validate that the colorBy value exists in COLOR_OPTIONS, fallback to 'pageHealth' if not
        const isValidColorBy = COLOR_OPTIONS.some(opt => opt.value === colorByValue);
        setColorBy(isValidColorBy ? colorByValue : 'pageHealth');
      } else if (key === 'nodesFixOnDrag') {
        setNodesFixOnDrag(latestSettings[key]);
      }
    });
    // linkLengthValue is computed automatically per graph on data load (getDynamicLinkLength) and is
    // no longer a user-adjustable / persisted setting, so it is not restored here.
    if (!Object.keys(latestSettings).includes('nodesFixOnDrag')) {
      setNodesFixOnDrag(false);
    }
  };

  useEffect(() => {
    if (depthNodesGraph && depthNodesGraph['nodes']?.length) {
      let nodesClone = [...depthNodesGraph['nodes']];
      const links = depthNodesGraph['links'] || [];
      const targetNodeIds = new Set<number>();
      links.forEach((link: any) => {
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (targetId !== undefined && targetId !== null) {
          targetNodeIds.add(targetId);
        }
      });

      nodesClone = nodesClone.map(node => ({
        ...node,
        collapsed: false,
        childLinks: [],
        isOrphan: !targetNodeIds.has(node.id) && (node.depth ?? 0) > 0,
      }));

      // Position orphan nodes in a fixed cluster (they have no links)
      // This keeps them grouped together instead of scattered by repulsion forces
      // Use dynamic default offset (will be updated from main graph bounds in onEngineStop)
      const orphanNodes = nodesClone.filter((n: any) => n.isOrphan);
      const orphanCount = orphanNodes.length;
      if (orphanCount > 0) {
        const mainNodeCount = nodesClone.length - orphanCount;
        const pos = getDefaultOrphanOffset(linkLengthValue, mainNodeCount, type === 4);
        orphanNodes.forEach((node: any, i) => {
          const cols = Math.ceil(Math.sqrt(orphanCount));
          const row = Math.floor(i / cols);
          const col = i % cols;
          node.fx = pos.x + (col - cols / 2) * ORPHAN_CLUSTER_SPREAD;
          node.fy = pos.y + (row - Math.ceil(orphanCount / cols) / 2) * ORPHAN_CLUSTER_SPREAD;
          if (pos.z !== undefined) {
            node.fz = pos.z;
          }
        });
      }

      const nodeIds = Object.fromEntries(
        nodesClone.map(node => [node.id, node]),
      ) as Record<string, IDepthNode & {childLinks: IDepthLink[]}>;
      links.forEach(link => {
        nodeIds[link.source]?.childLinks.push(link);
      });
      setNodesById(nodeIds);
      // Same root rule as buildSpanningTree (graph-layouts.ts): prefer the depth===0
      // node, falling back to the first node only when none is marked depth 0. Using
      // a different rule here (e.g. always nodes[0]) could disagree with the spanning
      // tree's root and produce an inconsistent layout.
      const rootCandidate = nodesClone.find(node => (node.depth ?? 0) === 0) ?? nodesClone[0];
      setRootNodeId(rootCandidate?.id);
      const maxNodeDepthValue = nodesClone.sort((a, b) => b.depth - a.depth)[0].depth;
      setMaxDepthValue(maxNodeDepthValue);

      // Dynamic Max Depth: use shared logic (default 2 when total nodes > 3000)
      const totalNodes = nodesClone.length;
      const defaultMaxDepth = getDefaultMaxDepthForGraph(totalNodes);

      // Automatic per-graph link length (no manual slider): computed here, batched with the node
      // data, so the layout settles once at a density sized to this graph instead of a fixed 115.
      setLinkLengthValue(getDynamicLinkLength(totalNodes, maxNodeDepthValue));

      if (maxNodeDepthValue >= defaultMaxDepth) {
        setExpandToLevel(defaultMaxDepth);
      } else {
        setExpandToLevel(maxNodeDepthValue);
      }
      setDepthNodesData({nodes: nodesClone, links});
      setIsData(true);
      getSettings();
      setDataLoader(false);
    }
  }, [depthNodesGraph]);

  const FocusGraph = () => {
    const isBrowser = () => typeof window !== 'undefined';
    const fgRef = useRef<any>();
    const nodeOriginalPositionsRef = useRef<Map<number, {x: number; y: number; z?: number}>>(new Map());
    const orphanClusterRef = useRef<{sphere: THREE.Mesh | null; label: any | null}>({sphere: null, label: null});
    const orphanCircleDrawn2DRef = useRef<boolean>(false);
    const stabilizedPositionsRef = useRef<Map<number, {x: number; y: number; z?: number}>>(new Map());
    const positionsStabilizedRef = useRef<boolean>(false);
    const currentDataKeyRef = useRef<string>('');
    const starfieldRef = useRef<THREE.Points | null>(null);
    const [name, setname] = useState('name');
    // Bumped by resetAllStates to force layoutTargetPositions to recompute even when nothing else
    // it depends on changed — so "Reset view" re-runs the layout transition and snaps any
    // dragged/pinned nodes back to their deterministic default positions.
    const [layoutResetNonce, setLayoutResetNonce] = useState(0);

    // LPS-352: dispose ForceGraph on unmount so Three.js renderer/scenes and
    // the underlying canvas are released. Without this, navigating away from
    // the visualization leaks renderers and accumulates heap.
    useEffect(() => {
      return () => {
        const fg = fgRef.current;
        if (!fg) return;
        try {
          disposeForceGraph(fg);
        } catch (err) {
          reportError(err, {section: 'graph-force-unmount'});
        }
        fgRef.current = null;
      };
    }, []);
    // const [setalert] = useState({});
    // chart zoom functionality

    const getPrunedTree = fromNodeClick => {
      const visibleNodes = [];
      const visibleLinks = [];
      (function traverseTree(node = nodesById[rootNodeId]) {
        if (!node || visibleNodes.some(n => n.id === node.id)) {
          return;
        }
        visibleNodes.push(node);
        if (node.collapsed || (!fromNodeClick && node?.depth >= expandToLevel)) {
          if (node.childLinks.length != 0) {
            node.collapsed = true;
          }
          return;
        }
        if (node.childLinks) {
          visibleLinks.push(...node.childLinks);
          node.childLinks
            .map(link => ((typeof link.target) === 'object') ? link.target : nodesById[link.target])
            .forEach(traverseTree);
        }
      })();

      // Add orphan nodes to the visible nodes (they're not reachable from root)
      if (!hideOrphans) {
        const orphanNodesToAdd = depthNodesData.nodes.filter((node: any) =>
          node.isOrphan && !visibleNodes.some(n => n.id === node.id),
        );
        if (orphanNodesToAdd.length > 0) {
          visibleNodes.push(...orphanNodesToAdd);
        }
      }

      return {nodes: visibleNodes, links: visibleLinks};
    };

    const loadPrunedGraphData = () => {
      depthNodesData.nodes.forEach(node => node.collapsed = false);
      const result = getPrunedTree(false);

      // Re-apply orphan node positions after pruning (dynamic default; updated in onEngineStop)
      const orphanNodes = result.nodes.filter((n: any) => n.isOrphan);
      const orphanCount = orphanNodes.length;
      if (orphanCount > 0 && !hideOrphans) {
        const mainNodeCount = result.nodes.length - orphanCount;
        const pos = getDefaultOrphanOffset(linkLengthValue, mainNodeCount, type === 4);
        orphanNodes.forEach((node: any, i) => {
          const cols = Math.ceil(Math.sqrt(orphanCount));
          const row = Math.floor(i / cols);
          const col = i % cols;
          node.fx = pos.x + (col - cols / 2) * ORPHAN_CLUSTER_SPREAD;
          node.fy = pos.y + (row - Math.ceil(orphanCount / cols) / 2) * ORPHAN_CLUSTER_SPREAD;
          if (pos.z !== undefined) {
            node.fz = pos.z;
          }
        });
      }

      setDepthNodesData(result);
    };

    useEffect(() => {
      if (isData) {
        loadPrunedGraphData();
      }
    }, [expandToLevel, isData]);

    useEffect(() => {
      if (linkLengthValue) {
        onLinkLengthChange(linkLengthValue);
      }
      handleNodesFixOnDrag(nodesFixOnDrag);
    }, [linkLengthValue, nodesFixOnDrag]);

    useEffect(() => {
      if (nodesFixOnDrag && !dataLoader && depthNodesData.nodes?.length && fgRef.current) {
        const timeoutId = setTimeout(() => {
          const nodesWithPositions = depthNodesData.nodes.filter((node: any) =>
            node.x !== undefined && node.y !== undefined,
          );

          if (nodesWithPositions.length > 0) {
            nodesWithPositions.forEach((node: any) => {
              node.fx = node.x;
              node.fy = node.y;
              if (type === 4 && node.z !== undefined) {
                node.fz = node.z;
              }
            });
            // See the guard note in handleNodesFixOnDrag: only reheat once the graph has settled.
            if (positionsStabilizedRef.current && fgRef.current.d3ReheatSimulation) {
              fgRef.current.d3ReheatSimulation();
            }
          }
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    }, [nodesFixOnDrag, depthNodesData.nodes, dataLoader, type]);

    const zoomItem = () => {
      try {
        const getRef = fgRef.current.scene();
        const obj = getRef.children[3].children?.filter(item => {
          return item?.__data.id === deviceInfo.name;
        });

        const zoom = obj[0].__data;
        // setalert(zoom);

        const distance = 180;
        const distRatio = 1 + distance / Math.hypot(zoom.x, zoom.y, zoom.z);

        fgRef.current.cameraPosition(
          {
            x: zoom.x * distRatio,
            y: zoom.y * distRatio,
            z: zoom.z * distRatio,
          },
          zoom,
          3000,
        );
      } catch (error) {
        console.error('Caught error:', error);
      }
    };

    if (deviceInfo.name != null) {
      if (deviceInfo.name !== name) {
        setname(deviceInfo.name);
        zoomItem();
      }
    }

    const handleClick = useCallback(
      node => {
        if (!node) {
          setSelectedNodeDetail(null);
          return;
        }
        if (node?.id !== undefined) {
          setSearchNodeId(node.id);
        }
        setSelectedNodeDetail(node);

        const nodeDistance = Math?.hypot(node?.x || 0, node?.y || 0, node?.z || 0);
        const baseDistance = node?.depth === 0 ? 200 : node?.depth === 1 ? 150 : 120;
        const minDistance = Math.max(baseDistance, nodeDistance * 0.5);
        const distRatio = 1 + minDistance / Math.max(nodeDistance, 1);

        fgRef.current.cameraPosition(
          {
            x: node.x * distRatio,
            y: node.y * distRatio,
            z: node.z * distRatio,
          },
          node,
          2000,
        );
      },
      [fgRef],
    );
    const handle2dClick = useCallback(
      node => {
        if (!node) {
          setSelectedNodeDetail(null);
          return;
        }
        if (node?.id !== undefined) {
          setSearchNodeId(node.id);
        }
        setSelectedNodeDetail(node);

        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2, 2000);
      },
      [fgRef],
    );
    const focusSelectedNodeDetail = useCallback(() => {
      if (!selectedNodeDetail) return;
      if (type === 5) {
        handle2dClick(selectedNodeDetail);
      } else {
        handleClick(selectedNodeDetail);
      }
    }, [selectedNodeDetail, type, handleClick, handle2dClick]);
    const clearSelectedNodeDetail = useCallback(() => {
      setSelectedNodeDetail(null);
      setSearchNodeId(-1);
    }, []);

    // Selection-only counterpart of handleClick/handle2dClick: opens the detail popup and drives
    // the branch highlight (via searchNodeId) WITHOUT moving the camera. Canvas clicks use this so a
    // click only selects + highlights; zoom-on-select stays exclusive to the popup's "Focus node"
    // button (which still calls handleClick/handle2dClick).
    const selectNode = useCallback(node => {
      if (!node) {
        setSelectedNodeDetail(null);
        return;
      }
      if (node?.id !== undefined) {
        setSearchNodeId(node.id);
      }
      setSelectedNodeDetail(node);
    }, []);
    // 2D and 3D selection have identical (camera-free) behavior, so they share one implementation.
    const select2dNode = selectNode;

    // Drives the branch-highlight preview on hover. `node` is null when the cursor leaves all
    // nodes (hover-off). Purely sets hover state — never touches the click-driven detail popup
    // (setSelectedNodeDetail) or search input.
    const handleNodeHover = useCallback((node: any) => {
      // Drop a stale hover-IN reported by the library's throttled raycast after the cursor has
      // already left the canvas (see isPointerInsideCanvasRef) — otherwise the last node stays lit
      // with nothing left to clear it. A hover-OUT (null) always passes through so clears never stall.
      if (node && !isPointerInsideCanvasRef.current) return;
      const previousId = hoveredNodeIdRef.current;
      const newId = node?.id ?? null;
      hoveredNodeIdRef.current = newId;
      setHoveredNode(node ?? null);
      if (previousId === newId) return;
      // Repaint only the affected node(s)' label highlight directly — do NOT route this through
      // nodeThreeObject, which would clear/rebuild every node's THREE object (see the comment on
      // hoveredNodeIdRef above).
      if (previousId !== null) updateNodeHighlightRef.current(previousId);
      if (newId !== null) updateNodeHighlightRef.current(newId);
    }, []);

    // Tracks the cursor for the hover info-card and clamps it inside the viewport so the card never
    // spills off-screen. Estimated card dimensions are enough for a simple flip-to-other-side clamp.
    const handleHoverCardMouseMove = useCallback((event: MouseEvent) => {
      let x = event.clientX + HOVER_CARD_CURSOR_OFFSET;
      let y = event.clientY + HOVER_CARD_CURSOR_OFFSET;
      if (x + HOVER_CARD_EST_WIDTH > window.innerWidth) {
        x = event.clientX - HOVER_CARD_EST_WIDTH - HOVER_CARD_CURSOR_OFFSET;
      }
      if (y + HOVER_CARD_EST_HEIGHT > window.innerHeight) {
        y = event.clientY - HOVER_CARD_EST_HEIGHT - HOVER_CARD_CURSOR_OFFSET;
      }
      setHoverCardPos({x: Math.max(0, x), y: Math.max(0, y)});
    }, []);

    // Only listen for mouse movement while a node is actually hovered (both 2D and 3D share
    // hoveredNode), so we never track the cursor when nothing needs it. Scoped to the graph's own
    // canvas container rather than document.body.
    useEffect(() => {
      if (!hoveredNode) {
        setHoverCardPos(null);
        return;
      }
      const container = canvasWrapperRef.current;
      if (!container) return;
      container.addEventListener('mousemove', handleHoverCardMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleHoverCardMouseMove);
      };
    }, [hoveredNode, handleHoverCardMouseMove]);

    // In-degree of the hovered node within the CURRENT filtered graph: count links whose TARGET
    // endpoint is this node. Recomputed only when the hovered node (or link set) changes — a cheap
    // per-hover O(links) scan, no whole-graph in-degree map. Endpoints may be raw ids or {id} refs
    // after the engine mutates them, so normalize both via getEndpointId (same as isLinkHighlighted).
    const hoveredInboundCount = useMemo(() => {
      if (hoveredNode == null || hoveredNode.id == null) return 0;
      const targetId = hoveredNode.id;
      let count = 0;
      for (const link of filteredGraphData.links) {
        if (getEndpointId(link.target as number | {id: number}) === targetId) count++;
      }
      return count;
    }, [hoveredNode, filteredGraphData.links]);

    const saveSettings = (key, value) => {
      if (type === 5) {
        const latestSettings = getLocalStorageItem('site_visualization_settings') && getLocalStorageItem('site_visualization_settings') !== 'undefined' ? JSON.parse(getLocalStorageItem('site_visualization_settings')) : {};
        latestSettings[key] = value;
        setLocalStorageItem('site_visualization_settings', JSON.stringify(latestSettings));
      } else {
        const latestSettings = getLocalStorageItem('site_visualization_settings') && getLocalStorageItem('site_visualization_settings') !== 'undefined' ? JSON.parse(getLocalStorageItem('site_visualization_settings')) : {};
        latestSettings[key] = value;
        setLocalStorageItem('site_visualization_settings', JSON.stringify(latestSettings));
      }
    };
    const onDepthLevelChange = (newValue: number) => {
      setExpandToLevel(newValue);
    };
    // Applies the current (auto-computed) link length to the live d3 link force. Not persisted and
    // not user-triggered anymore — called by the sync effect when the per-graph value changes.
    const onLinkLengthChange = (newValue: number) => {
      setLinkLengthValue(newValue);
      if (!dataLoader && depthNodesData?.nodes?.length) {
        const linkForce = fgRef?.current?.d3Force('link');
        linkForce?.distance(() => newValue);
      }
    };
    const handleChange = val => {
      saveSettings('sizeBy', val);
      setSizeBy(val);
    };

    const handleColorByChange = val => {
      saveSettings('colorBy', val);
      setColorBy(val);
    };


    const handleNodesFixOnDrag = val => {
      saveSettings('nodesFixOnDrag', val);
      setNodesFixOnDrag(val);
      nodesFixOnDragRef.current = val;

      const nodesToUpdate = filteredGraphData?.nodes?.length ? filteredGraphData.nodes : depthNodesData.nodes;
      if (!dataLoader && nodesToUpdate?.length && fgRef.current) {
        if (val) {
          nodesToUpdate.forEach((node: any) => {
            if (node.x !== undefined && node.y !== undefined) {
              node.fx = node.x;
              node.fy = node.y;
              if (type === 4 && node.z !== undefined) {
                node.fz = node.z;
              }
            }
          });
        } else {
          stabilizedPositionsRef.current?.clear();
          positionsStabilizedRef.current = false;
          nodesToUpdate.forEach((node: any) => {
            if (node.isOrphan) return;
            node.fx = null;
            node.fy = null;
            if (type === 4 && node.fz !== undefined) {
              node.fz = null;
            }
          });
        }
        requestAnimationFrame(() => {
          // Only reheat once this graph instance has ticked at least once (positionsStabilizedRef
          // is set by onEngineStop, and reset to false on both dataset and type changes — see the
          // graphDataKey and [type] effects). Calling d3ReheatSimulation() before the underlying
          // force-graph library has created its internal simulation throws inside its own
          // animation loop (state.layout is still undefined) — an unhandled, uncatchable crash
          // from our side, since it happens on a later requestAnimationFrame tick, outside this
          // call stack.
          if (!positionsStabilizedRef.current) return;
          if (fgRef.current?.d3ReheatSimulation) {
            fgRef.current.d3ReheatSimulation();
          }
          if (typeof fgRef.current?.refresh === 'function') {
            fgRef.current.refresh();
          }
        });
      }
    };

    // Single source of truth for framing the graph. Padding is viewport-relative (see
    // getFitPadding) so the breathing room stays visually constant across canvas and graph sizes,
    // instead of the old fixed 220px/350px pad that dominated small canvases and vanished on large.
    const fitGraphToView = useCallback((durationMs: number) => {
      if (!fgRef.current?.zoomToFit) return;
      const ratio = type === 5 ? FIT_PADDING_RATIO_2D : FIT_PADDING_RATIO_3D;
      fgRef.current.zoomToFit(durationMs, getFitPadding(graphWidth, graphHeight, ratio));
    }, [fgRef, type, graphWidth, graphHeight]);

    // FIRST-FRAME FRAMING.
    //
    // react-force-graph mounts at zoom 1 centred on the origin, but our rings sit ~7.6*linkLength
    // units out, so the opening frames showed a hugely magnified, off-centre graph until a
    // zoomToFit landed (and zoomToFit itself can only run once positions exist). Deriving the zoom
    // from the layout's KNOWN outer-ring radius lets the very first painted frame be framed
    // correctly, with no measurement and no waiting for the simulation — the same approach the
    // design prototype takes in prewarm() -> _fitView(). The engine-stop zoomToFit still runs
    // afterwards as the exact correction (it matters for 'force' mode, where the real extent is
    // emergent rather than ring-derived).
    useIsomorphicLayoutEffect(() => {
      const fg = fgRef.current;
      if (!forceGraphsReady || !fg || !filteredGraphData.nodes?.length) return;
      // 2D only. The 3D view already positions its own camera on mount and drives a continuous
      // auto-rotate loop; re-seating the camera here fought that loop for the opening frames
      // without improving the framing, so 3D is left to its existing path.
      if (type !== 5 || typeof fg.zoom !== 'function') return;
      const outerRadius = getRingRadius(Math.min(maxDepthValue ?? 3, 3), linkLengthValue);
      fg.centerAt?.(0, 0, 0);
      fg.zoom(getGeometryFitZoom2d(graphWidth, graphHeight, outerRadius), 0);
    }, [forceGraphsReady, graphDataKey, type, graphWidth, graphHeight, linkLengthValue, maxDepthValue]);

    // One-shot framing once the layout settles: centre + zoom the 2D graph to a good composition.
    // No masking — this only moves the camera, so it can never leave the UI stuck.
    const frameSettledGraph = useCallback(() => {
      if (settleWatchdogRef.current) clearTimeout(settleWatchdogRef.current);
      settleWatchdogRef.current = null;
      if (settleHardCapRef.current) clearTimeout(settleHardCapRef.current);
      settleHardCapRef.current = null;
      if (type === 5) {
        // Analytic framing. zoomToFit centres on the bounding box of every node, so now that the
        // orphan disc sits properly clear of the main graph it would drag the view sideways and
        // leave the root visibly off-centre. Blending the bbox centre toward the root turns that
        // either/or (bbox-centred = root off-centre, root-centred = orphans clipped) into one
        // tunable: FRAME_ROOT_BIAS 0 = pure bbox, 1 = pure root. Zoom is derived from half-spans
        // measured about the BLENDED centre, so biasing can never push content out of frame.
        const nodes = filteredGraphData.nodes ?? [];
        const bounds = getCompositionBounds2d(nodes);
        if (bounds) {
          const root = nodes.find((n: {depth?: number}) => n.depth === 0);
          const rootX = root?.x ?? 0;
          const rootY = root?.y ?? 0;
          const cx = (bounds.minX + bounds.maxX) / 2;
          const cy = (bounds.minY + bounds.maxY) / 2;
          const centreX = cx + (rootX - cx) * FRAME_ROOT_BIAS;
          const centreY = cy + (rootY - cy) * FRAME_ROOT_BIAS;
          const halfX = Math.max(centreX - bounds.minX, bounds.maxX - centreX);
          const halfY = Math.max(centreY - bounds.minY, bounds.maxY - centreY);
          const pad = getFitPadding(graphWidth, graphHeight, FIT_PADDING_RATIO_2D);
          fgRef.current?.centerAt?.(centreX, centreY, 0);
          fgRef.current?.zoom?.(
            clampZoom2d(Math.min(
              (graphWidth - 2 * pad) / (2 * Math.max(halfX, 1)),
              (graphHeight - 2 * pad) / (2 * Math.max(halfY, 1)),
            )),
            0,
          );
        } else {
          fitGraphToView(0);
        }
      }
    }, [fitGraphToView, type, filteredGraphData, fgRef, graphWidth, graphHeight]);

    useEffect(() => {
      frameSettledGraphRef.current = frameSettledGraph;
    }, [frameSettledGraph]);

    // Fired from onEngineStop — the authoritative "layout finished" signal. Stable identity.
    const handleGraphSettled = useCallback(() => {
      frameSettledGraphRef.current();
    }, []);

    // Idle watchdog for framing: if the engine stops ticking without ever firing onEngineStop
    // (react-force-graph can skip it, e.g. a fully-pinned layout), this still frames the graph.
    // Stable identity (calls via ref).
    const handleSettleTick = useCallback(() => {
      if (settleWatchdogRef.current) clearTimeout(settleWatchdogRef.current);
      settleWatchdogRef.current = setTimeout(() => frameSettledGraphRef.current(), GRAPH_SETTLE_IDLE_MS);
    }, []);

    const stableOnEngineTick2d = useCallback(() => {
      handleSettleTick();
    }, [handleSettleTick]);

    // Arm the framing watchdog + hard-cap backstop whenever a genuinely new graph loads (data set
    // or view type changes); whichever fires first frames it. Both call through the ref so their
    // closures stay fresh without this effect depending on them.
    useEffect(() => {
      handleSettleTick();
      settleHardCapRef.current = setTimeout(() => frameSettledGraphRef.current(), GRAPH_SETTLE_HARD_CAP_MS);
      return () => {
        if (settleWatchdogRef.current) clearTimeout(settleWatchdogRef.current);
        if (settleHardCapRef.current) clearTimeout(settleHardCapRef.current);
      };
    }, [graphDataKey, type, handleSettleTick]);

    const zoomFitHandler = useCallback(() => {
      fitGraphToView(500);
    }, [fitGraphToView]);

    const handleZoomIn = useCallback(() => {
      if (fgRef.current) {
        if (type === 5) {
          fgRef.current.zoom(clampZoom2d(fgRef.current.zoom() * ZOOM_STEP_2D), 300);
        } else {
          const camera = fgRef.current.camera();
          if (camera) {
            const distance = camera.position.length();
            // Zooming IN shortens the orbit radius; clamped so it can't punch through the graph.
            const newDistance = clampCameraDistance3d(distance / ZOOM_STEP_3D, linkLengthValue);
            const direction = camera.position.clone().normalize();
            fgRef.current.cameraPosition(
              {x: direction.x * newDistance, y: direction.y * newDistance, z: direction.z * newDistance},
              null,
              300,
            );
          }
        }
      }
    }, [fgRef, type, linkLengthValue]);

    const handleZoomOut = useCallback(() => {
      if (fgRef.current) {
        if (type === 5) {
          // Exact inverse of the zoom-in step so in→out round-trips back to the same zoom.
          fgRef.current.zoom(clampZoom2d(fgRef.current.zoom() / ZOOM_STEP_2D), 300);
        } else {
          const camera = fgRef.current.camera();
          if (camera) {
            const distance = camera.position.length();
            // Exact inverse of the zoom-in step, clamped so it can't recede past the graph.
            const newDistance = clampCameraDistance3d(distance * ZOOM_STEP_3D, linkLengthValue);
            const direction = camera.position.clone().normalize();
            fgRef.current.cameraPosition(
              {x: direction.x * newDistance, y: direction.y * newDistance, z: direction.z * newDistance},
              null,
              300,
            );
          }
        }
      }
    }, [fgRef, type, linkLengthValue]);
    const handleNodeDrag = useCallback((node: any) => {
      if (!node || !fgRef.current) return;
      // react-force-graph-2d/3d have no onNodeDragStart event (only onNodeDrag/onNodeDragEnd), so
      // this per-frame callback is the only hook that ever fires before drag-end cleanup — capture
      // the pre-drag position here, once per gesture. By the time this runs, node.x/fx are already
      // overwritten with the current pointer position, so read the ORIGINAL position the drag
      // library itself preserved before it started mutating the node: force-graph stores it as
      // node.__initialDragPos, 3d-force-graph as node.__initialPos.
      if (!nodeOriginalPositionsRef.current.has(node.id)) {
        const libInitialPos = type === 4 ? node.__initialPos : node.__initialDragPos;
        if (libInitialPos) {
          const originalPos: {x: number; y: number; z?: number} = {
            x: libInitialPos.x,
            y: libInitialPos.y,
          };
          if (type === 4 && libInitialPos.z !== undefined) {
            originalPos.z = libInitialPos.z;
          }
          nodeOriginalPositionsRef.current.set(node.id, originalPos);
        }
      }
    }, [type]);

    const fixNodesOnDrag = useCallback((node: any) => {
      if (!node || !fgRef.current) return;

      const shouldFix = nodesFixOnDragRef.current;

      if (shouldFix) {
        node.fx = node.x;
        node.fy = node.y;
        if (type === 4 && node.z !== undefined) {
          node.fz = node.z;
        }
        // See the guard note in handleNodesFixOnDrag: only reheat once the graph has settled.
        if (positionsStabilizedRef.current && fgRef.current.d3ReheatSimulation) {
          fgRef.current.d3ReheatSimulation();
        }
        nodeOriginalPositionsRef.current.delete(node.id);
      } else {
        // Snap back to where the node started the drag.
        //
        // This used to null fx/fy, restore x/y and reheat — relying on d3 to pull the node home.
        // That cannot work here: useGraphForces strips BOTH charge and link forces (2D and 3D)
        // because the layouts are deterministic and pinned, so the reheated simulation has nothing
        // to compute, and the library's drag leaves position under fx/fy anyway — which outrank
        // x/y. The node therefore stayed wherever it was dropped.
        //
        // Writing the captured position back into fx/fy restores it through the same channel the
        // layout itself uses, so it wins regardless of what the drag handler left behind. Nodes are
        // already pinned by useLayoutTransition, so re-pinning at the original spot is consistent.
        const originalPos = nodeOriginalPositionsRef.current.get(node.id);
        if (originalPos) {
          node.x = originalPos.x;
          node.y = originalPos.y;
          node.fx = originalPos.x;
          node.fy = originalPos.y;
          if (type === 4 && originalPos.z !== undefined) {
            node.z = originalPos.z;
            node.fz = originalPos.z;
          }
          nodeOriginalPositionsRef.current.delete(node.id);
        }
        if (fgRef.current.refresh) {
          fgRef.current.refresh();
        }
      }
    }, [type]);

    // Cache scale functions per scaleKey to avoid sorting the entire node array per-node per-frame
    const scalerCacheRef = useRef<{key: string; scalers: Record<string, any>}>({key: '', scalers: {}});
    // Tracks the last custom rings/label group built per node id, so nodeThreeObject can dispose
    // the previous group's geometry/materials before building a replacement instead of leaking them.
    const nodeObjectCacheRef = useRef<Map<number, THREE.Group>>(new Map());
    // Retained for the "Size by" settings machinery; node size is now uniform (see
    // getNodeSizeValue) so this scaler is no longer invoked for rendering.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getScaler = (node, scaleKey) => {
      if (!depthNodesData['nodes']) return undefined;
      if (scaleKey === 'none') return MAX_SCALE;

      // Rebuild cache when data changes
      const cacheKey = `${depthNodesData.nodes.length}-${scaleKey}`;
      if (scalerCacheRef.current.key !== cacheKey) {
        const nodesList = depthNodesData['nodes'];
        let min = Infinity;
        let max = -Infinity;
        for (const n of nodesList) {
          const val = n[scaleKey];
          if (val != null && !isNaN(val)) {
            if (val < min) min = val;
            if (val > max) max = val;
          }
        }
        scalerCacheRef.current = {
          key: cacheKey,
          scalers: {[scaleKey]: d3.scaleLinear([min ?? 0, max], [1, MAX_SCALE])},
        };
      }
      const scaler = scalerCacheRef.current.scalers[scaleKey];
      if (!scaler) return MAX_SCALE;
      const nodeVal = scaler(node[scaleKey]);
      return Math.abs(nodeVal);
    };
    const calculateNodeColour = useCallback((node: any) => {
      // A node with no status at all is "no data", not "confirmed non-indexable" — don't
      // paint it alarm-red for a status the backend never reported.
      const hasStatus = node['status'] !== null && node['status'] !== undefined;

      const colorByResult = getColorByValue(node, colorBy);
      if (colorByResult) {
        return colorByResult;
      }
      if (!hasStatus) {
        return NO_DATA_COLOR;
      }
      if (node['status'] !== 'Active') {
        return nonIndexableNodeColour;
      }
      return color2xx;
      // Selection is indicated by the separate gold ring drawn around the node, not by
      // recoloring the node's own fill — its color-by color stays exactly the same when
      // clicked, so it never renders in the wrong color family for the active "Color nodes by".
    }, [colorBy, color2xx, nonIndexableNodeColour]);

    // Min/max of the selected "Size nodes by" metric across the current node set, so a node's raw
    // metric value (e.g. traffic=4200) can be normalized into a 0–1 position before being mapped
    // to a pixel size. Recomputed only when the metric or the node set itself changes.
    const sizeMetricRange = useMemo(() => {
      const nodes = filteredGraphData.nodes as any[];
      let min = Infinity;
      let max = -Infinity;
      for (const n of nodes ?? []) {
        const raw = sizeBy === 'issue' ? n.issueCount : n[sizeBy];
        const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
        if (value < min) min = value;
        if (value > max) max = value;
      }
      return {min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : 0};
    }, [filteredGraphData, sizeBy]);

    const NODE_SIZE_MIN = 9;
    const NODE_SIZE_MAX = 24;

    const getNodeSizeValue = (node?: any) => {
      if (!node) {
        // Generic/global contexts with no specific node to size (layout spacing estimates,
        // orphan-cluster bounds, etc.) — use the uniform baseline so that math stays conservative.
        return 13 * nodeSizeValue;
      }
      const {min, max} = sizeMetricRange;
      const range = max - min;
      const raw = sizeBy === 'issue' ? node.issueCount : node[sizeBy];
      const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
      const normalized = range > 0 ? (value - min) / range : 0.5;
      // Lower depth = closer to the root = more important, so depth inverts: shallow pages render
      // bigger. Every other metric scales directly (higher value = bigger node).
      const scaled = sizeBy === 'depth' ? 1 - normalized : normalized;
      const size = NODE_SIZE_MIN + scaled * (NODE_SIZE_MAX - NODE_SIZE_MIN);
      // The linear depth scale alone barely distinguishes the root from depth-1 (e.g. only ~3px
      // apart on a typical site), so the root gets an extra boost on top to read as clearly the
      // most prominent node, not just marginally bigger.
      const isRootByDepth = sizeBy === 'depth' && node.depth === 0;
      return (isRootByDepth ? size * 1.6 : size) * nodeSizeValue;
    };

    const createNodeLabel = useCallback((node: any, size: number, isHighlighted: boolean = false) => {
      const group = new THREE.Group();
      // Tagged so a hover change can find and replace just this label without touching the
      // rest of the node's group (see updateNodeHighlight below).
      group.userData.isNodeLabelGroup = true;

      // Extract the last path segment from URL
      const url = node.url ?? '';
      const urlMatch = url.match(/^https?:\/\/(?:www\.)?([^/]+)(?:\/(.*))?$/);
      const pathString = urlMatch?.[2] ?? '';
      const pathParts = pathString.split('/').filter(part => part.length > 0);

      // Always use the last path segment, preserving original casing and formatting
      let labelText = '';
      if (pathParts.length > 0) {
        labelText = pathParts[pathParts.length - 1];
      } else {
        // Root path - use "index" as fallback
        labelText = 'index';
      }

      if (!labelText || labelText.trim().length === 0) {
        return group;
      }

      const sprite = new SpriteText(
        labelText.length > 16 ? `${labelText.slice(0, 16)}...` : labelText,
      );

      // Calibrated (not guessed) so each tier's on-screen sprite height matches the confirmed-good 2D
      // font sizes (16/13/11px for depth 0/1/2). SpriteText sets scale.y = textHeight + 2*padding +
      // 2*borderWidth (+ |offsetY|); here padding=2, borderWidth=0 ⇒ baseScaleY = textSize + 4. The
      // per-frame rescale in use-engine-callbacks makes on-screen height = (baseScaleY /
      // NODE_LABEL_REFERENCE_DISTANCE) * viewportH / (2·tan(fov/2)), with fov=50° (three's default
      // PerspectiveCamera) and viewportH≈graphHeight (600). Solving at REFERENCE=360:
      //   depth0 baseScaleY 9  → 16.1px, depth1 7.3 → 13.0px, depth2 6.2 → 11.1px.
      const textSize = node.depth === 0 ? 5 : node.depth === 1 ? 3.3 : 2.2;
      sprite.textHeight = textSize;

      // Theme colors only — no shadow, no extra effects
      const isLight = theme === 'light';

      sprite.color = isLight ? '#0a0a0a' : '#ffffff'; // or '#111111', '#0f0f0f', '#1c1c1c'
      // Click-selected or hovered nodes get a purple label background; all others keep the
      // theme-based near-black/white scheme unchanged.
      sprite.backgroundColor = isHighlighted ? '#a05fdd' : (isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.95)');
      sprite.strokeColor = isLight ? '#000000' : 'transparent';
      sprite.strokeWidth = isLight ? 0.6 : 0; // 0.4–0.8 usually looks good


      sprite.borderRadius = isLight ? 1 : 2;
      // Reverted padding & radius to original / very close to original values
      sprite.padding = 2; // was originally ~2
      sprite.borderRadius = 2; // was originally 2

      // Explicitly remove any border that could look like shadow
      sprite.borderWidth = 0; // no border at all — prevents any outline/shadow-like effect
      sprite.borderColor = 'transparent';

      // Position label clearly below the node so it doesn't overlap when zoomed in on click.
      // Sphere radius = size, so keep label center well below sphere bottom (-size).
      const gapBelowSphere = 6;
      const baseOffset = size + gapBelowSphere + textSize * 1.2;
      const spriteObj = sprite as unknown as THREE.Sprite & {
        material: THREE.Material & {depthTest: boolean; depthWrite: boolean};
      };
      spriteObj.position.y = -baseOffset;

      // depthTest is toggled per-frame: true for non-selected (respect depth), false for selected (label on top when zoomed).
      spriteObj.renderOrder = 1000;
      if (spriteObj.material) {
        spriteObj.material.depthTest = true;
        spriteObj.material.depthWrite = false;
      }

      // Tag the sprite and record its authored (base) scale so the per-frame hook in
      // use-engine-callbacks can rescale it proportional to camera distance, keeping labels a
      // constant on-screen size instead of shrinking/growing with zoom (Sprites scale with
      // perspective distance by default). SpriteText sets sprite.scale synchronously inside
      // _genCanvas() on every property setter, so scale.x/scale.y are final by this point.
      spriteObj.userData.isNodeLabel = true;
      spriteObj.userData.baseScaleX = spriteObj.scale.x;
      spriteObj.userData.baseScaleY = spriteObj.scale.y;

      group.add(sprite);
      return group;
    }, [theme]);

    // Applies hover/search label highlighting to a single already-built node, in place — the
    // targeted alternative to letting nodeThreeObject (which depends on hoveredNode) rebuild
    // every node's THREE object on each hover change. Finds and disposes the node's existing
    // label group (tagged isNodeLabelGroup in createNodeLabel), then re-adds one if the node
    // should still show a label (depth 0-1 nodes always do; deeper nodes only when highlighted).
    const updateNodeHighlight = useCallback((nodeId: number) => {
      const group = nodeObjectCacheRef.current.get(nodeId);
      if (!group) return;
      const node = (depthNodesData?.nodes as IDepthNode[] | undefined)?.find(n => n.id === nodeId);
      if (!node) return;

      const existingLabel = group.children.find(child => child.userData?.isNodeLabelGroup);
      if (existingLabel) {
        group.remove(existingLabel);
        disposeObject3DTree(existingLabel);
      }

      // Size with the node's OWN size, not the generic baseline — otherwise the hover-patched glow
      // (and label offset) would snap to a different scale than nodeThreeObject used at build time,
      // which was especially visible on the root (a 1.6× boosted node). isRootNode drives the same
      // opaque-disc glow sizing as the initial build (see getGlowDiameterMultiplier).
      const baseSize = getNodeSizeValue(node);
      const isRootNode = node.depth === 0;
      const isHighlighted = searchNodeId === node.id || hoveredNodeIdRef.current === node.id;
      if (showLabels && (node.depth <= 1 || isHighlighted)) {
        const labelGroup = createNodeLabel(node, baseSize, isHighlighted);
        group.add(labelGroup);
      }

      // Re-scale/re-opacity the glow sprite in place — mirrors nodeThreeObject's original
      // isHighlightedVisual glow-boost formula, applied as a patch instead of a rebuild so hover
      // no longer needs nodeThreeObject to depend on it (see nodeThreeObject's comment).
      const glowSprite = group.children.find(child => child.userData?.isGlowSprite) as THREE.Sprite | undefined;
      if (glowSprite) {
        const deemphasized = isNodeDeemphasized(node);
        const outsideSelection = highlightSetRef.current.size > 0 && !highlightSetRef.current.has(nodeId);
        const nodeOpacity = Math.min(deemphasized ? SELECTION_DIM_OPACITY_3D : 1, outsideSelection ? SELECTION_DIM_OPACITY_3D : 1);
        const glowDiameterMultiplier = getGlowDiameterMultiplier(isRootNode, isHighlighted);
        glowSprite.scale.set(baseSize * glowDiameterMultiplier, baseSize * glowDiameterMultiplier, 1);
        const material = glowSprite.material as THREE.SpriteMaterial;
        material.opacity = isHighlighted ? Math.min(1, nodeOpacity * 1.6) : nodeOpacity;
      }
    }, [depthNodesData, searchNodeId, showLabels, createNodeLabel, isNodeDeemphasized]);

    useEffect(() => {
      updateNodeHighlightRef.current = updateNodeHighlight;
    }, [updateNodeHighlight]);

    // nodeThreeObjectExtend is false — this group (body sprite + glow + rings + label) fully
    // replaces the library's default sphere, including for hit-testing/hover/drag.
    const nodeThreeObject = useCallback((node: any) => {
      // Dispose the previous rings/label group for this node before building a replacement —
      // three-forcegraph doesn't do this itself, so without it every regeneration (search,
      // size/color/emphasis toggles) leaks the old group's geometries/materials.
      const previousGroup = nodeObjectCacheRef.current.get(node.id);
      if (previousGroup) {
        disposeObject3DTree(previousGroup);
      }

      const group = new THREE.Group();
      const baseSize = getNodeSizeValue(node);
      const deemphasized = isNodeDeemphasized(node);
      // Two independent dimming reasons — the existing filter/search de-emphasis and the new
      // selection-branch dimming (node outside the selected node's highlighted branch). Take the
      // MORE dimmed (lower) opacity so neither silently overrides the other.
      // Read from the ref, not the reactive highlightSet — see highlightSetRef's comment above.
      const outsideSelection = highlightSetRef.current.size > 0 && !highlightSetRef.current.has(node.id);
      const nodeOpacity = Math.min(deemphasized ? SELECTION_DIM_OPACITY_3D : 1, outsideSelection ? SELECTION_DIM_OPACITY_3D : 1);
      // Read from the ref, not reactive hoveredNode — see hoveredNodeIdRef's comment. Hover-only
      // changes are applied afterward via updateNodeHighlight instead of rebuilding through here.
      const isHovered = hoveredNodeIdRef.current === node.id;
      // Clicking a node keeps it visually highlighted the same way hovering does.
      const isHighlightedVisual = isHovered || searchNodeId === node.id;
      // The root (depth 0) renders as an opaque disc rather than a translucent sprite, so its glow is
      // sized differently (see getGlowDiameterMultiplier). Computed up here so the glow block below
      // can read it.
      const isRootNode = node.depth === 0;

      // Soft ambient glow behind the node, in its own color — same effect as 2D's canvas radial
      // gradient, ported to 3D as a camera-facing sprite so it always billboards toward the viewer
      // regardless of rotation/orbit. Hovering scatters a bigger, brighter version of the same glow.
      const [glowR, glowG, glowB] = parseColorToRgb(calculateNodeColour(node));
      const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getNodeGlowTexture(),
        color: new THREE.Color(glowR / 255, glowG / 255, glowB / 255),
        transparent: true,
        depthWrite: false,
        opacity: isHighlightedVisual ? Math.min(1, nodeOpacity * 1.6) : nodeOpacity,
      }));
      const glowDiameterMultiplier = getGlowDiameterMultiplier(isRootNode, isHighlightedVisual);
      glowSprite.scale.set(baseSize * glowDiameterMultiplier, baseSize * glowDiameterMultiplier, 1);
      glowSprite.raycast = () => {}; // decorative only — never intercepts node click/hover hit-testing
      glowSprite.renderOrder = 0;
      // Base opacity multiplier (before nodeOpacity is applied), so updateNodeOpacity can recompute
      // this object's opacity later without rebuilding it.
      glowSprite.userData.baseOpacityFactor = 1;
      // Tagged so updateNodeHighlight can find and re-scale/re-opacity this exact sprite on hover
      // change, in place, instead of nodeThreeObject depending on hover and rebuilding every node.
      glowSprite.userData.isGlowSprite = true;
      group.add(glowSprite);

      // Node body — a semi-transparent, soft-edged circle (not the library's default opaque sphere;
      // nodeThreeObjectExtend is false, so this sprite IS the node's clickable/hoverable/draggable
      // surface, using the sprite's default raycast behavior — do not override it to a no-op here.
      const nodeBody = isRootNode ?
        new THREE.Mesh(
          getRootNodeBodySphereGeometry(),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(glowR / 255, glowG / 255, glowB / 255),
            transparent: true,
            depthWrite: true,
            opacity: nodeOpacity,
          }),
        ) :
        new THREE.Sprite(new THREE.SpriteMaterial({
          map: getNodeBodyTexture(),
          color: new THREE.Color(glowR / 255, glowG / 255, glowB / 255),
          transparent: true,
          depthWrite: false,
          opacity: nodeOpacity,
        }));
      if (isRootNode) {
        nodeBody.scale.set(baseSize, baseSize, baseSize);
      } else {
        nodeBody.scale.set(baseSize * NODE_BODY_DIAMETER_MULTIPLIER, baseSize * NODE_BODY_DIAMETER_MULTIPLIER, 1);
      }
      nodeBody.renderOrder = 1;
      nodeBody.userData.baseOpacityFactor = 1;
      group.add(nodeBody);

      // Everything below (rings, label) layers on top of the node body/glow.
      const isPrunable = node?.isPrunable === true;
      const showPrunableRing = showPrunable && isPrunable;

      const isOrphan = node?.isOrphan === true;
      if (!hideOrphans && isOrphan) {
        // Orange ring for orphan nodes - matching Graph2D style (#FF9800)
        const orphanRing = new THREE.Mesh(
          new THREE.TorusGeometry(baseSize * 1.3, baseSize * 0.1, 8, 16),
          new THREE.MeshBasicMaterial({color: 0xFF9800, transparent: true, opacity: 0.9 * nodeOpacity}), // Orange (#FF9800) - matching Graph2D
        );
        orphanRing.rotation.x = Math.PI / 2;
        orphanRing.userData.baseOpacityFactor = 0.9;
        group.add(orphanRing);

        // Add a second ring at different angle for better 3D visibility
        const orphanRing2 = new THREE.Mesh(
          new THREE.TorusGeometry(baseSize * 1.3, baseSize * 0.1, 8, 16),
          new THREE.MeshBasicMaterial({color: 0xFF9800, transparent: true, opacity: 0.9 * nodeOpacity}),
        );
        orphanRing2.rotation.y = Math.PI / 2;
        orphanRing2.userData.baseOpacityFactor = 0.9;
        group.add(orphanRing2);
      }

      if (showPrunableRing) {
        const prunableRing = new THREE.Mesh(
          new THREE.TorusGeometry(baseSize * 1.45, baseSize * 0.12, 8, 16),
          new THREE.MeshBasicMaterial({color: 0xE74C3C, transparent: true, opacity: 0.85 * nodeOpacity}),
        );
        prunableRing.rotation.x = Math.PI / 2;
        prunableRing.userData.baseOpacityFactor = 0.85;
        group.add(prunableRing);
        const prunableRing2 = new THREE.Mesh(
          new THREE.TorusGeometry(baseSize * 1.45, baseSize * 0.12, 8, 16),
          new THREE.MeshBasicMaterial({color: 0xE74C3C, transparent: true, opacity: 0.85 * nodeOpacity}),
        );
        prunableRing2.rotation.y = Math.PI / 2;
        prunableRing2.userData.baseOpacityFactor = 0.85;
        group.add(prunableRing2);
      }

      // Purple label background when the node is click-selected OR hovered (independent of the
      // click-only highlight rings above). Computed before the visibility check because depth 2+
      // nodes only show a label at all when highlighted.
      // Read the current hover from the ref, not reactive state — see hoveredNodeIdRef's comment.
      // Hover-only highlight changes are applied afterward via updateNodeHighlight instead of
      // rebuilding through this function.
      const isHighlighted = searchNodeId === node.id || hoveredNodeIdRef.current === node.id;
      if (showLabels && (node.depth <= 1 || isHighlighted)) {
        const labelGroup = createNodeLabel(node, baseSize, isHighlighted);
        group.add(labelGroup);
      }

      nodeObjectCacheRef.current.set(node.id, group);
      return group;
      // highlightSet intentionally excluded — read via highlightSetRef instead (see its comment).
      // hoveredNode intentionally excluded — read via hoveredNodeIdRef instead (see its comment);
      // hover-only changes are applied afterward via updateNodeHighlight instead of rebuilding here.
    }, [searchNodeId, sizeBy, nodeSizeValue, depthNodesData, isNodeDeemphasized, colorBy, showPrunable, hideOrphans, showLabels, nodePassesMetricFilters, createNodeLabel, calculateNodeColour]);

    // Applies branch-highlight dimming to a single already-built node, in place — same rationale
    // as updateNodeHighlight: avoids nodeThreeObject depending on highlightSet, which would force
    // a full node-object rebuild on every hover via the branch-highlight-preview useMemo below.
    // Relies on each opacity-bearing child being tagged with userData.baseOpacityFactor at
    // creation time (see nodeThreeObject) so the original per-part multiplier isn't lost.
    const updateNodeOpacity = useCallback((nodeId: number) => {
      const group = nodeObjectCacheRef.current.get(nodeId);
      if (!group) return;
      const node = (depthNodesData?.nodes as IDepthNode[] | undefined)?.find(n => n.id === nodeId);
      if (!node) return;

      const deemphasized = isNodeDeemphasized(node);
      const outsideSelection = highlightSetRef.current.size > 0 && !highlightSetRef.current.has(nodeId);
      const nodeOpacity = Math.min(deemphasized ? SELECTION_DIM_OPACITY_3D : 1, outsideSelection ? SELECTION_DIM_OPACITY_3D : 1);

      group.traverse(obj => {
        const baseFactor = obj.userData?.baseOpacityFactor;
        if (typeof baseFactor !== 'number') return;
        const material = (obj as THREE.Sprite | THREE.Mesh).material as (THREE.Material & {opacity?: number}) | undefined;
        if (material && typeof material.opacity === 'number') {
          material.opacity = baseFactor * nodeOpacity;
        }
      });
    }, [depthNodesData, isNodeDeemphasized]);

    // Keeps highlightSetRef current and repaints the nodes whose dim state could have changed, so
    // nodeThreeObject does not have to rebuild every node whenever highlightSet's identity changes.
    //
    // A node is dimmed when a selection is ACTIVE (set non-empty) and the node is OUTSIDE it, so the
    // nodes that change on a transition are NOT just the branch members — they depend on whether the
    // selection crosses the active/not-active boundary:
    //   • empty ⇄ non-empty (click-select, click-deselect, hover-on, hover-off): EVERY node's dim
    //     state flips (all-dimmed ⇄ all-lit outside the branch), so every cached node must repaint.
    //     Repainting only the branch union here was the bug that left outside nodes un-dimmed on the
    //     first selection and stuck-dimmed after deselecting.
    //   • branch → branch (both active, e.g. hovering across nodes): only nodes entering or leaving
    //     the branch change; nodes outside BOTH stay dimmed, so the old∪new union is sufficient.
    useEffect(() => {
      const previousSet = highlightSetRef.current;
      highlightSetRef.current = highlightSet;
      if (previousSet === highlightSet) return;
      const activeChanged = (previousSet.size > 0) !== (highlightSet.size > 0);
      if (activeChanged) {
        nodeObjectCacheRef.current.forEach((_group, id) => updateNodeOpacity(id));
        return;
      }
      const affected = new Set<number>();
      previousSet.forEach(id => affected.add(id));
      highlightSet.forEach(id => affected.add(id));
      affected.forEach(id => updateNodeOpacity(id));
    }, [highlightSet, updateNodeOpacity]);

    const linkVisibility = useCallback(() => true, []);

    const getLinkDistance = useCallback(link => {
      const sourceDepth = link?.source?.depth ?? 0;
      const targetDepth = link?.target?.depth ?? 0;
      const maxDepth = Math.max(sourceDepth, targetDepth);
      if (maxDepth >= 3) {
        return linkLengthValue * 0.4;
      }
      if (maxDepth === 2) {
        return linkLengthValue * 0.7;
      }
      if (maxDepth === 1) {
        return linkLengthValue * 1.1;
      }
      return linkLengthValue * 1.4;
    }, [linkLengthValue]);

    const get2dLinkDistance = useCallback((link: any) => {
      const sourceDepth = typeof link.source === 'object' ? link.source?.depth : 0;
      const targetDepth = typeof link.target === 'object' ? link.target?.depth : 0;
      const maxD = Math.max(sourceDepth || 0, targetDepth || 0);
      if (maxD === 0) return linkLengthValue * 2;
      if (maxD === 1) return linkLengthValue * 1.2;
      if (maxD === 2) return linkLengthValue * 0.6;
      return linkLengthValue * 0.3;
    }, [linkLengthValue]);

    // Per-link color accessor. With NO node selected it returns the flat linkColor exactly as before
    // (zero visual change). With a selection active, EACH highlighted link takes its own SOURCE
    // node's color — a red parent's outgoing links are red, but a green child's own outgoing links
    // are green, regardless of what the overall selected/hovered node's color is — so color always
    // follows the edge's origin, never the destination or a single color for the whole branch.
    // Everything outside the highlighted branch is darkened toward the background so it recedes.
    const getLinkColor = useCallback((link: ISelectionLink) => {
      if (highlightSet.size === 0) return linkColor;
      if (isLinkHighlighted(link, highlightSet)) {
        const sourceId = getEndpointId(link.source as number | {id: number});
        const sourceNode = (nodesById as Record<string, any>)[sourceId];
        if (sourceNode) return calculateNodeColour(sourceNode);
        // Fallback for the rare tick where the source node isn't in the map yet: tint from
        // whichever node currently drives the highlight.
        const highlightSourceNode = selectedNodeDetail ?? hoveredNode;
        return highlightSourceNode ? calculateNodeColour(highlightSourceNode) : linkColor;
      }
      return lightenColor(linkColor, -60);
    }, [linkColor, highlightSet, selectedNodeDetail, hoveredNode, calculateNodeColour, nodesById]);
    // Opacity has to be carried by the color's alpha, not the linkOpacity prop, for BOTH renderers:
    //  - 3D (three-forcegraph) caches link materials by color string and never re-applies a changed
    //    linkOpacity to an existing material, so the prop appears frozen after first paint.
    //  - 2D (force-graph) has no linkOpacity prop at all; it just strokes with the link color.
    // Baking opacity into the alpha fixes both: the 3D cache key varies per opacity value (fresh
    // material each change) and the 2D stroke picks up the alpha directly. The 3D graph pairs this
    // with linkOpacity={1} so its effective opacity is 1 * alpha = the slider value.
    const getLinkColorWithOpacity = useCallback((link: ISelectionLink) => {
      const [r, g, b] = parseColorToRgb(getLinkColor(link));
      const alpha = typeof linkOpacityValue === 'number' ? linkOpacityValue : 0.2;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }, [getLinkColor, linkOpacityValue]);
    // Per-link width accessor: highlighted branch links get a modest thickening; everything else keeps
    // the current width (dimming is carried by color, not by shrinking links below visibility).
    const getLinkWidth = useCallback((link: ISelectionLink) => {
      if (highlightSet.size === 0) return linkWidth;
      return isLinkHighlighted(link, highlightSet) ? linkWidth * 1.8 : linkWidth;
    }, [linkWidth, highlightSet]);
    const getNodeVal = useCallback((node: any) => Math.pow(getNodeSizeValue(node), 3) / 64, [sizeBy, nodeSizeValue, sizeMetricRange]);
    const getNodeColor = useCallback((node: any) => calculateNodeColour(node), [calculateNodeColour]);
    // Keeps a live handle on the selection for the imperative auto-rotate pause/resume helpers
    // below, which fire from click handlers directly — a background-click miss never changes
    // `selectedNodeDetail` (it's already null), so a state-diffing effect alone can't catch it.
    useEffect(() => {
      selectedNodeDetailRef.current = selectedNodeDetail;
    }, [selectedNodeDetail]);

    const recenterAndResumeRotation = useCallback(() => {
      const controls = rotationControlsRef.current;
      if (!controls || selectedNodeDetailRef.current) return;
      // Node selection flies the camera to look at that node, which permanently overwrites the
      // orbit target. Re-center it here so rotation always orbits the graph's center, not wherever
      // the last-selected/focused node happened to be.
      if (controls.target) {
        controls.target.set(GRAPH_ROTATION_CENTER.x, GRAPH_ROTATION_CENTER.y, GRAPH_ROTATION_CENTER.z);
      } else {
        controls.target = new THREE.Vector3(GRAPH_ROTATION_CENTER.x, GRAPH_ROTATION_CENTER.y, GRAPH_ROTATION_CENTER.z);
      }
      // Auto-rotate disabled — the 3D graph stays still; users can drag to orbit.
      controls.autoRotate = false;
    }, []);

    // Matches the mockup's `mousedown` -> `cam.autoRot = false`: pauses instantly, independent of
    // whether the click ends up changing selection state.
    const pauseAutoRotate = useCallback(() => {
      if (rotationResumeTimeoutRef.current) {
        clearTimeout(rotationResumeTimeoutRef.current);
        rotationResumeTimeoutRef.current = null;
      }
      if (rotationControlsRef.current) {
        rotationControlsRef.current.autoRotate = false;
      }
    }, []);

    // Matches the mockup's `mouseup` -> `setTimeout(() => { if (!selected) autoRot = true }, 2500)`.
    const scheduleAutoRotateResume = useCallback(() => {
      if (rotationResumeTimeoutRef.current) {
        clearTimeout(rotationResumeTimeoutRef.current);
      }
      rotationResumeTimeoutRef.current = setTimeout(() => {
        rotationResumeTimeoutRef.current = null;
        recenterAndResumeRotation();
      }, ROTATE_RESUME_DELAY_MS);
    }, [recenterAndResumeRotation]);

    // selectNode/select2dNode never move the camera, so the single-node ">1" guard that exists to
    // skip the camera-fly animation (handleClick/handle2dClick, below) doesn't apply here — a
    // lone-node graph must still be selectable/clickable to open its detail popup.
    const handleNodeClick = useCallback((node: any) => {
      pauseAutoRotate();
      selectNode(node);
    }, [pauseAutoRotate, selectNode]);
    const handle2dNodeClick = useCallback((node: any) => {
      select2dNode(node);
    }, [select2dNode]);
    // 3D-only: the reference design pauses auto-rotate on ANY click, including a miss (no node
    // hit) — react-force-graph-3d has no generic "any click" event, so a background-click miss is
    // wired separately from handleNodeClick. Clears any open detail popup, matching a background
    // click deselecting, then schedules the delayed resume since nothing is selected afterward.
    const handleBackgroundClick = useCallback(() => {
      pauseAutoRotate();
      selectNode(null);
      scheduleAutoRotateResume();
    }, [pauseAutoRotate, selectNode, scheduleAutoRotateResume]);
    const onDrag = useCallback((node: any) => handleNodeDrag(node), [handleNodeDrag]);
    const onDragEnd = useCallback((node: any) => fixNodesOnDrag(node), [fixNodesOnDrag]);

    const resetAllStates = () => {
      setSizeBy('depth');
      setColorBy('pageHealth');
      saveSettings('colorBy', 'pageHealth');
      setNonIndexableNodeColour(themeColors.nonIndexableColor);
      setLinkColor(getLinkBaseColor(theme === 'dark', type === 4));
      setColor2xx(themeColors.nodeColor);
      setLinkWidth(1);
      setLinkLengthValue(115);
      fitGraphToView(3000);
      setNodesFixOnDrag(false);
      setSearchNodeId(-1);
      // Snap any dragged/pinned nodes back to the deterministic default layout. Node positions live
      // in fx/fy (which outrank x/y, and the forces are stripped so d3 can't relayout), so clearing
      // settings alone leaves moved nodes where they were dropped. Bumping this nonce forces
      // layoutTargetPositions to recompute, which re-runs useLayoutTransition and animates every
      // node home.
      setLayoutResetNonce(nonce => nonce + 1);
      if (maxDepthValue !== null) {
        const totalNodes = depthNodesGraph?.['nodes']?.length ?? 0;
        const defaultMaxDepth = getDefaultMaxDepthForGraph(totalNodes);
        setExpandToLevel(maxDepthValue >= defaultMaxDepth ? defaultMaxDepth : maxDepthValue);
      }
      setLocalStorageItem('site_visualization_settings', 'undefined');
    };

    useEffect(() => {
      if (searchNodeId !== -1) {
        const searchedNode = depthNodesData['nodes'].filter(item => item?.id === searchNodeId);
        calculateNodeColour(searchedNode);
      }
      getSettings();
    }, [searchNodeId]);

    useEffect(() => {
      setSearchNodeId(-1);
      getSettings();
      // ForceGraph3D/ForceGraph2D are different component types, so switching `type` always
      // unmounts one and mounts a fresh instance — the new instance's internal layout hasn't
      // ticked yet, so any "has this graph settled" signal from the previous instance is stale.
      positionsStabilizedRef.current = false;
    }, [type]);

    useEffect(() => {
      if (currentDataKeyRef.current && currentDataKeyRef.current !== graphDataKey) {
        stabilizedPositionsRef?.current?.clear();
        positionsStabilizedRef.current = false;
        currentDataKeyRef.current = '';
      }
    }, [graphDataKey]);

    // One-time (per type/data) setup: finds the OrbitControls instance and starts its render loop.
    // Pause/resume from here on is purely imperative (rotationControlsRef + the helpers above), so
    // this no longer needs to re-run on every selection change.
    useEffect(() => {
      if (!isBrowser() || type !== 4) {
        return undefined;
      }

      let animationFrame: number | null = null;
      let pollInterval: ReturnType<typeof setInterval> | null = null;
      let controls: IOrbitControlsLike | null = null;

      const startRotating = () => {
        if (!controls) return;
        controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
        rotationControlsRef.current = controls;
        recenterAndResumeRotation();

        const animate = () => {
          controls?.update();
          animationFrame = requestAnimationFrame(animate);
        };
        animate();
      };

      let attempts = 0;
      const maxAttempts = 30;
      pollInterval = setInterval(() => {
        attempts++;
        controls = fgRef?.current?.controls?.();
        if (controls) {
          clearInterval(pollInterval as ReturnType<typeof setInterval>);
          pollInterval = null;
          startRotating();
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval as ReturnType<typeof setInterval>);
          pollInterval = null;
        }
      }, 50);

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        if (rotationResumeTimeoutRef.current) {
          clearTimeout(rotationResumeTimeoutRef.current);
          rotationResumeTimeoutRef.current = null;
        }
        if (controls) {
          controls.autoRotate = false;
        }
        rotationControlsRef.current = null;
      };
    }, [type, graphDataKey, recenterAndResumeRotation]);

    // Safety net for selection changes that don't go through a click handler (search dropdown,
    // "Focus node" button, closing the popup via its X): pause the instant something becomes
    // selected, and schedule the delayed resume the instant it's cleared. `hadSelectionRef` keeps
    // this from firing a spurious resume-delay on initial mount, when nothing was ever selected.
    useEffect(() => {
      if (!isBrowser() || type !== 4) {
        return undefined;
      }
      if (selectedNodeDetail) {
        hadSelectionRef.current = true;
        pauseAutoRotate();
      } else if (hadSelectionRef.current) {
        hadSelectionRef.current = false;
        scheduleAutoRotateResume();
      }
      return undefined;
    }, [type, selectedNodeDetail, pauseAutoRotate, scheduleAutoRotateResume]);

    // Starfield background (3D view only). Attaches a spherical shell of points to the ForceGraph
    // scene once it becomes available (same polling-for-readiness pattern as the camera rotation
    // effect). The per-frame Y rotation runs on its OWN independent requestAnimationFrame loop
    // (below), decoupled from camera movement, so the field keeps turning unconditionally even while
    // the camera's auto-rotate is paused (e.g. when a node is selected) — it must never freeze.
    // Scoped to `type === 4` so switching to/from the 2D view detaches/reattaches it without leaking.
    useEffect(() => {
      // Starfield background removed — the 3D view uses a plain black background.
      if (true) return undefined;
      // eslint-disable-next-line no-unreachable
      if (!isBrowser() || type !== 4) return undefined;

      // Independent rotation loop, started once the starfield exists and cancelled in cleanup. Tied
      // to this effect's lifecycle (type/graphDataKey), so a re-run cancels the old loop before a new
      // one starts — mirroring how the starfield's own attach/detach avoids duplicate THREE.Points.
      let rafId: number | null = null;
      const rotateStarfield = () => {
        if (starfieldRef.current) {
          starfieldRef.current.rotation.y += STARFIELD_ROTATION_SPEED;
        }
        rafId = requestAnimationFrame(rotateStarfield);
      };

      let attempts = 0;
      const maxAttempts = 30;
      const interval = setInterval(() => {
        attempts++;
        const scene: THREE.Scene | null = fgRef?.current?.scene?.() ?? null;
        if (scene) {
          clearInterval(interval);
          // Positions may not be settled yet on first attach; getMainGraphBounds returns null
          // until nodes have coordinates, in which case getStarfieldRadiusRange falls back to its
          // absolute floor — the shell stays visibly distant rather than collapsing onto the graph.
          const extent = getMainGraphBounds(filteredGraphData.nodes, true)?.extent ?? 0;
          const {minRadius, maxRadius} = getStarfieldRadiusRange(extent);
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(generateStarPositions(STAR_COUNT, minRadius, maxRadius), 3),
          );
          const isDarkTheme = themeRef.current === 'dark';
          const material = new THREE.PointsMaterial({
            color: isDarkTheme ? STAR_COLOR_DARK : STAR_COLOR_LIGHT,
            size: STAR_SIZE,
            transparent: true,
            opacity: isDarkTheme ? STAR_OPACITY_DARK : STAR_OPACITY_LIGHT,
            sizeAttenuation: false,
          });
          const stars = new THREE.Points(geometry, material);
          stars.frustumCulled = false;
          scene.add(stars);
          starfieldRef.current = stars;
          rotateStarfield();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 50);

      return () => {
        clearInterval(interval);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        const stars = starfieldRef.current;
        if (stars) {
          const scene: THREE.Scene | null = fgRef?.current?.scene?.() ?? null;
          scene?.remove(stars);
          disposeObject3DTree(stars);
          starfieldRef.current = null;
        }
      };
    }, [type, graphDataKey]);

    // Keep the starfield color/opacity in sync with the active theme by mutating the existing
    // material in place — no geometry regeneration needed (mirrors the reference's setTheme).
    useEffect(() => {
      const stars = starfieldRef.current;
      if (!stars) return;
      const material = stars.material as THREE.PointsMaterial;
      const isDarkTheme = theme === 'dark';
      material.color.set(isDarkTheme ? STAR_COLOR_DARK : STAR_COLOR_LIGHT);
      material.opacity = isDarkTheme ? STAR_OPACITY_DARK : STAR_OPACITY_LIGHT;
    }, [theme]);

    // 3d-force-graph's own node-drag-end handler dispatches a synthetic `pointerup` on `document`
    // (to force-cancel OrbitControls' pressed state after a drag) whose pointerId never had a
    // matching entry recorded in OrbitControls' internal `_pointerPositions` map (that pointer was
    // never tracked, since navigation controls are disabled for the whole duration of the drag).
    // OrbitControls' onPointerUp then reads `.x` off that missing entry and throws — this is the
    // library's own best-effort cleanup step, not real user interaction, so make the lookup
    // fail-safe instead of crashing on every node click/drag in the 3D view.
    useEffect(() => {
      if (!isBrowser() || type !== 4) return undefined;

      let attempts = 0;
      const maxAttempts = 30;
      const interval = setInterval(() => {
        attempts++;
        const controls: any = fgRef?.current?.controls?.();
        if (controls) {
          clearInterval(interval);
          if (controls._pointerPositions && !controls.__siteLensPointerSafetyPatched) {
            controls._pointerPositions = new Proxy(controls._pointerPositions, {
              // Must be a real THREE.Vector2 (not a plain {x,y} literal): OrbitControls both
              // reads .x/.y directly off this AND calls .set() on it internally (_trackPointer),
              // so a plain object satisfies the first caller but throws on the second.
              get: (target: Record<string, unknown>, key: string) => target[key] ?? new THREE.Vector2(0, 0),
            });
            controls.__siteLensPointerSafetyPatched = true;
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }, [type, graphDataKey]);

    // Helper function to calculate orphan cluster centroid and radius from actual node positions
    const {updateOrphanClusterPosition} = useOrphanCluster({
      orphanClusterRef, fgRef, type, dataLoader, filteredGraphData, hideOrphans,
      trackTimeout, themeRef, linkLengthValue, expandToLevel,
    });

    // Export event handler - zooms to fit all nodes before canvas capture
    useEffect(() => {
      const handleExportPrepare = (event: Event) => {
        if (!fgRef.current) return;

        const customEvent = event as CustomEvent<IGraphExportEventDetail>;
        const {graphType, callback} = customEvent.detail || {graphType: -1, callback: () => undefined};

        // Only handle if this is the correct graph type
        if (graphType !== type) return;

        const invokeCallback = () => {
          if (callback && typeof callback === 'function') {
            callback();
          }
        };

        try {
          if (type === 5) {
            // 2D graph - zoom to fit all nodes with minimal padding for full export
            fgRef.current.zoomToFit(0, 20); // Instant zoom with small padding

            // Wait for the zoom to complete, then trigger the callback
            trackTimeout(invokeCallback, 100);
          } else if (type === 4) {
            // 3D graph - zoom to fit
            fgRef.current.zoomToFit(0, 50);

            trackTimeout(invokeCallback, 100);
          }
        } catch (error) {
          reportError(error, {section: 'graph-export-prepare'});
          // Still call callback to not block export
          invokeCallback();
        }
      };

      window.addEventListener('graph-export-prepare', handleExportPrepare);

      return () => {
        window.removeEventListener('graph-export-prepare', handleExportPrepare);
      };
    }, [type]);

    // Bound the 3D orbit distance. Setting min/maxDistance on the OrbitControls clamps the WHEEL
    // (and any drag-dolly) natively — the zoom buttons clamp themselves via clampCameraDistance3d.
    // Limits are recomputed when the link-length slider rescales the layout.
    useEffect(() => {
      if (type !== 4 || !forceGraphsReady || !fgRef.current?.controls) return;
      const controls = fgRef.current.controls() as {
        minDistance?: number; maxDistance?: number; enableZoom?: boolean;
        touches?: {ONE?: number; TWO?: number};
      } | null;
      if (!controls) return;
      const {min, max} = getCameraDistanceLimits3d(linkLengthValue);
      controls.minDistance = min;
      controls.maxDistance = max;
      // Reinforce OrbitControls' own touch defaults (one-finger rotate, two-finger dolly+pan) —
      // explicit rather than relying on the library default, since the native-pinch guard right
      // below only pays off if OrbitControls itself is actually configured to treat two touches
      // as a zoom gesture.
      controls.enableZoom = true;
      if (controls.touches) {
        controls.touches.ONE = THREE.TOUCH.ROTATE;
        controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
      }
    }, [type, forceGraphsReady, linkLengthValue, graphDataKey]);

    // OrbitControls' own touchmove handler (three/examples/jsm/controls/OrbitControls.js) never
    // calls event.preventDefault() — it relies entirely on the `touch-action: none` it sets on the
    // renderer's canvas at connect() time to stop the browser from treating a two-finger gesture as
    // native page pinch-zoom. On some mobile browsers/layouts that CSS hint alone loses the race, so
    // the OS/browser zooms the whole page instead of the graph ever seeing a dolly gesture. Guard it
    // explicitly: a native (non-passive) touchmove listener that preventDefaults only for multi-touch,
    // so page pinch-zoom can never win here regardless of the touch-action timing, while one-finger
    // touches (rotate/scroll) are left completely alone.
    useEffect(() => {
      if (type !== 4) return undefined;
      const el = canvasWrapperRef.current;
      if (!el) return undefined;
      const blockNativePinchZoom = (event: TouchEvent) => {
        if (event.touches.length > 1) event.preventDefault();
      };
      el.addEventListener('touchmove', blockNativePinchZoom, {passive: false});
      return () => el.removeEventListener('touchmove', blockNativePinchZoom);
    }, [type, graphDataKey]);

    useEffect(() => {
      if (!fgRef.current || !depthNodesData.nodes?.length) return;

      try {
        if (type === 4) {
          const currentData = fgRef.current.graphData();
          if (currentData && currentData.nodes && currentData.links) {
            const newLinks = currentData.links.map((link: any) => ({
              ...link,
              _widthVersion: linkWidth,
            }));
            fgRef.current.graphData({
              nodes: [...currentData.nodes],
              links: newLinks,
            });
          }
        } else if (type === 5) {
          fgRef.current.refresh?.();
        }
      } catch (error) {
        console.warn('Failed to update graph:', error);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color2xx, nonIndexableNodeColour, linkColor, linkWidth, type]);

    useGraphForces({fgRef, type, depthNodesData, filteredGraphData});

    const layoutTargetPositions = useMemo(() => {
      if (!filteredGraphData.nodes?.length) return null;
      // 3D has no layout choice — it ALWAYS uses the single deterministic spherical layout (plain,
      // non-topic-clustered).
      if (type === 4) {
        return computeSphericalLayout(filteredGraphData.nodes, filteredGraphData.links ?? [], {
          clustered: false,
          ringUnit: linkLengthValue,
          // Every node renders at one constant radius (getNodeSizeValue()); pass it so the layout can
          // widen any over-crowded cap's shell just enough to stop sibling spheres from overlapping.
          nodeRadius: getNodeSizeValue(),
        });
      }
      // 2D has no layout choice either — it ALWAYS uses the fixed radial-fan layout.
      if (type === 5) {
        return computeRadialLayout(filteredGraphData.nodes, filteredGraphData.links ?? [], {
          ringUnit: linkLengthValue,
        });
      }
      return null;
      // layoutResetNonce is a dep so "Reset view" can force a fresh layout (and thus re-run the
      // layout transition) even when no other input changed — see resetAllStates.
    }, [type, filteredGraphData, linkLengthValue, nodeSizeValue, layoutResetNonce]);

    const getLayoutTransitionNodes = useStableCallback(() => filteredGraphData.nodes ?? []);

    useLayoutTransition({
      fgRef,
      targetPositions: layoutTargetPositions,
      getNodes: getLayoutTransitionNodes,
    });

    // Calculate which color options should be disabled based on data availability
    const colorOptionsWithDisabled = useMemo(() => {
      const nodes = depthNodesData.nodes || [];

      // Check if indexable has variation (both indexable and non-indexable nodes)
      const hasIndexableVariation = (() => {
        if (nodes.length === 0) return false;
        const indexableCount = nodes.filter((n: any) => n.status === 'Active').length;
        const nonIndexableCount = nodes.filter((n: any) => n.status !== 'Active').length;
        return indexableCount > 0 && nonIndexableCount > 0;
      })();

      // Check metrics that aren't in METRICS but are in COLOR_OPTIONS
      const checkMetricVariation = (key: string): boolean => {
        if (!metricBounds || !metricBounds[key]) {
          // If not in metricBounds, check nodes directly
          let min = Infinity;
          let max = -Infinity;
          let hasValidValues = false;

          nodes.forEach((node: any) => {
            const value = node[key];
            if (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value)) {
              hasValidValues = true;
              min = Math.min(min, value);
              max = Math.max(max, value);
            }
          });

          return hasValidValues && min !== max;
        }

        const bounds = metricBounds[key];
        return bounds && bounds.min !== bounds.max;
      };

      const optionsWithDisabled = COLOR_OPTIONS.map(option => {
        let disabled = false;
        let disabledReason = '';

        if (option.value === 'default') {
          // 'default' is always enabled
          disabled = false;
        } else if (option.value === 'indexable') {
          // Check if there's variation in indexable status
          disabled = !hasIndexableVariation;
          if (disabled) {
            disabledReason = 'All pages have the same indexable status';
          }
        } else if (option.value === 'pageHealth') {
          // Check metricBounds for pageHealth
          disabled = !checkMetricVariation('pageHealth');
          if (disabled) {
            disabledReason = 'No variation in page health scores';
          }
        } else if (option.value === 'traffic' || option.value === 'impressions' || option.value === 'keywords') {
          // These are in METRICS, check metricBounds
          disabled = !checkMetricVariation(option.value);
          if (disabled) {
            disabledReason = `No variation in ${option.label.toLowerCase()}`;
          }
        } else {
          // Other metrics (bounceRate, dwellTime, conversions, conversionValue, lastUpdated)
          // Check nodes directly
          disabled = !checkMetricVariation(option.value);
          if (disabled) {
            disabledReason = `No variation in ${option.label.toLowerCase()}`;
          }
        }

        return {
          ...option,
          disabled,
          disabledReason,
        };
      });

      // Sort: enabled options first, disabled options at the bottom
      return optionsWithDisabled.sort((a, b) => {
        if (a.disabled === b.disabled) {
          return 0; // Keep original order within enabled/disabled groups
        }
        return a.disabled ? 1 : -1; // Disabled items go to bottom
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depthNodesData.nodes?.length, metricBounds]);

    const colorLegend = useMemo(() => {
      const colorByLabel = COLOR_OPTIONS.find(option => option.value === colorBy)?.label ?? colorBy;
      return getColorLegendData(colorBy, colorByLabel);
    }, [colorBy]);

    const isDark = theme === 'dark';
    const zoomBtnTopClass = getZoomBtnClass(isDark, 'top');
    const zoomBtnMiddleClass = getZoomBtnClass(isDark, 'middle');
    const zoomBtnBottomClass = getZoomBtnClass(isDark, 'bottom');

    // Stable ForceGraph callbacks — identity never changes, closure always fresh
    const {
      stableOnEngineTick,
      stableOnEngineStop3d,
      stableOnRenderFramePost,
      stableNodePositionUpdate3d,
      stableOnEngineStop2d,
      stableNodePositionUpdate2d,
    } = useEngineCallbacks({
      fgRef, type, filteredGraphData, graphDataKey, hideOrphans, searchNodeId,
      orphanClusterRef, stabilizedPositionsRef, positionsStabilizedRef,
      currentDataKeyRef, nodesFixOnDragRef, updateOrphanClusterPosition,
      onGraphSettled: handleGraphSettled,
    });

    // Per-frame node-label rescale driver. The installed react-force-graph-3d@1.29.1 /
    // 3d-force-graph@1.79.1 stack does NOT implement the `onRenderFramePost` prop (added upstream in
    // a later release), so react-kapsule silently drops it and stableOnRenderFramePost never fires on
    // its own — which left the zoom-invariant label rescale dead, so labels kept their tiny authored
    // SpriteText world scale and rendered as specks at the graph's real (large) zoom-to-fit distance.
    // Drive the callback from the OrbitControls 'change' event instead: it fires on every camera move
    // that changes a label's on-screen size — the initial zoomToFit fly, continuous auto-rotate (the
    // library calls controls.update() each frame), and any user orbit/zoom/pan — keeping labels a
    // constant, readable size. Label rescale only needs to run when the camera actually moves (that's
    // the only time a label's apparent size changes) and the node-material upgrade is idempotent, so
    // both are safe as event-driven work here; the starfield rotation runs on its own rAF loop (see
    // the starfield effect above) so it never freezes when the camera is idle. Same poll-until-ready
    // pattern as the sibling 3D effects, since controls() is null until the graph mounts.
    useEffect(() => {
      if (!isBrowser() || type !== 4) return undefined;

      let controls: IOrbitControlsLike | null = null;
      let attempts = 0;
      const maxAttempts = 30;
      const interval = setInterval(() => {
        attempts++;
        const found: IOrbitControlsLike | null = fgRef?.current?.controls?.() ?? null;
        if (found?.addEventListener) {
          clearInterval(interval);
          controls = found;
          controls.addEventListener('change', stableOnRenderFramePost);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 50);

      return () => {
        clearInterval(interval);
        controls?.removeEventListener?.('change', stableOnRenderFramePost);
      };
    }, [type, graphDataKey, stableOnRenderFramePost]);

    // Plain useCallback (not useStableCallback) so identity changes when display settings change,
    // which is how ForceGraph2D detects it needs to repaint the canvas after the simulation cools.
    const stableNodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!hideOrphans && !orphanCircleDrawn2DRef.current && filteredGraphData?.nodes?.length) {
        const orphanNodes = filteredGraphData.nodes.filter((n: any) => n.isOrphan);
        if (orphanNodes.length > 0) {
          const ORPHAN_RING_SCALE = 1.4;
          const NODE_PADDING = 55;
          const LABEL_PADDING = 20;
          let minX = Infinity;
          let maxX = -Infinity;
          let minY = Infinity;
          let maxY = -Infinity;
          let maxDistanceFromCenter = 0;
          orphanNodes.forEach((n: any) => {
            const nodeSize = getNodeSizeValue(n);
            const drawX = n.x ?? n.fx ?? DEFAULT_ORPHAN_OFFSET_2D;
            const drawY = n.y ?? n.fy ?? 0;
            const extent = nodeSize * ORPHAN_RING_SCALE;
            minX = Math.min(minX, drawX - extent);
            maxX = Math.max(maxX, drawX + extent);
            minY = Math.min(minY, drawY - extent);
            maxY = Math.max(maxY, drawY + extent);
          });
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          orphanNodes.forEach((n: any) => {
            const nodeSize = getNodeSizeValue(n);
            const drawX = n.x ?? n.fx ?? DEFAULT_ORPHAN_OFFSET_2D;
            const drawY = n.y ?? n.fy ?? 0;
            const dx = drawX - centerX;
            const dy = drawY - centerY;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy) + nodeSize * ORPHAN_RING_SCALE;
            maxDistanceFromCenter = Math.max(maxDistanceFromCenter, distanceFromCenter);
          });

          const labelText = `Orphan Pages (${orphanNodes.length})`;
          const labelFontSize = 12;
          const labelPadding = 5;
          ctx.font = `bold ${labelFontSize}px Arial`;
          const textWidth = ctx.measureText(labelText).width;
          const labelHalfWidth = textWidth / 2 + labelPadding;
          const labelHalfHeight = labelFontSize / 2 + labelPadding;
          const radius = maxDistanceFromCenter + NODE_PADDING;

          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = '#FF9800';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const labelBgColor = theme === 'dark' ? 'rgba(26, 27, 31, 0.9)' : '#ffffff';
          const labelY = centerY - radius - LABEL_PADDING - labelHalfHeight;
          ctx.fillStyle = labelBgColor;
          ctx.fillRect(
            centerX - labelHalfWidth,
            labelY - labelHalfHeight,
            labelHalfWidth * 2,
            labelHalfHeight * 2,
          );
          ctx.fillStyle = '#FF9800';
          ctx.fillText(labelText, centerX, labelY);
          orphanCircleDrawn2DRef.current = true;
        }
      }

      // A node without a finite position yet (e.g. first paint before the simulation/layout
      // engine has placed it) would make createRadialGradient throw "non-finite" below — skip
      // drawing it this frame instead of crashing; it renders as soon as a position lands.
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

      const rawBaseSize = getNodeSizeValue(node);
      // createRadialGradient throws IndexSizeError on a negative/non-finite radius (unlike
      // ctx.arc, which silently tolerates it) — guard against bad upstream values (e.g. a
      // manually-typed out-of-range "Node size" input) reaching it.
      const baseSize = Number.isFinite(rawBaseSize) && rawBaseSize > 0 ? rawBaseSize : 1;
      const color = calculateNodeColour(node);
      const isHovered = hoveredNode?.id === node.id;
      // Clicking a node keeps it visually highlighted the same way hovering does.
      const isHighlightedVisual = isHovered || searchNodeId === node.id;
      const deemphasized = isNodeDeemphasized(node);
      // Combine the two independent dimming reasons (filter/search de-emphasis + being outside the
      // selected node's highlighted branch) by taking the MORE dimmed (lower) opacity.
      const outsideSelection = highlightSet.size > 0 && !highlightSet.has(node.id);
      const dimAlpha = Math.min(deemphasized ? SELECTION_DIM_OPACITY_2D : 1, outsideSelection ? SELECTION_DIM_OPACITY_2D : 1);
      const isDimmed = dimAlpha < 1;
      const isPrunable = node?.isPrunable === true;
      const isOrphan = node?.isOrphan === true;

      if (isDimmed) {
        ctx.globalAlpha = dimAlpha;
      }

      // Soft ambient glow behind the node, in its own color — gives nodes a sense of depth
      // against the dark canvas instead of reading as flat, isolated dots. Hovering scatters a
      // bigger, brighter version of the same glow so the hovered node visibly stands out.
      const [glowR, glowG, glowB] = parseColorToRgb(color);
      const glowRadius = baseSize * (isHighlightedVisual ? 4 : 2);
      const glowAlpha = isHighlightedVisual ? 0.6 : 0.35;
      const glow = ctx.createRadialGradient(node.x, node.y, baseSize * 0.4, node.x, node.y, glowRadius);
      glow.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, ${glowAlpha})`);
      glow.addColorStop(1, `rgba(${glowR}, ${glowG}, ${glowB}, 0)`);
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
      ctx.fillStyle = glow;
      ctx.fill();

      if (!hideOrphans && isOrphan) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, baseSize * 1.4, 0, 2 * Math.PI);
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (showPrunable && isPrunable) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, baseSize * 1.5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, baseSize, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // A crisp white ring on the hovered node's own edge, on top of the ambient dark border.
      // Counter-scaled by globalScale (like the label below) so it stays a thin, constant screen
      // width instead of growing along with the node when zoomed in.
      ctx.strokeStyle = isHighlightedVisual ? '#ffffff' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = isHighlightedVisual ? 1.5 / globalScale : 1;
      ctx.stroke();

      // Lighter highlight offset toward the upper-left — fakes a top-lit glossy sphere instead
      // of a flat disc, without needing a real light source (this is a 2D canvas, not Three.js).
      ctx.beginPath();
      ctx.arc(node.x - baseSize * 0.32, node.y - baseSize * 0.32, baseSize * 0.38, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(${Math.min(255, glowR + 60)}, ${Math.min(255, glowG + 60)}, ${Math.min(255, glowB + 60)}, 0.55)`;
      ctx.fill();

      // Purple label background when the node is click-selected OR hovered. Computed before the
      // visibility check because depth 2+ nodes only show a label at all when highlighted.
      const isHighlighted = searchNodeId === node.id || hoveredNode?.id === node.id;
      if (showLabels && (node.depth <= 1 || isHighlighted)) {
        const url = node.url ?? '';
        const urlMatch = url.match(/^https?:\/\/(?:www\.)?([^/]+)(?:\/(.*))?$/);
        const pathString = urlMatch?.[2] ?? '';
        const pathParts = pathString.split('/').filter((part: string) => part.length > 0);

        let label = '';
        if (pathParts.length > 0) {
          label = pathParts[pathParts.length - 1];
        } else {
          label = 'index';
        }

        if (label.length > 14) label = label.substring(0, 14) + '…';

        // Doubled from the original sizes for visibility.
        const fontSize = node.depth === 0 ? 16 : node.depth === 1 ? 13 : 11;
        // Counter-scale the label text/box by the canvas zoom transform (globalScale, passed by
        // react-force-graph-2d: 1 = default zoom, >1 zoomed in, <1 zoomed out) so the RENDERED
        // pixel size stays constant regardless of zoom. Every label dimension derived from the
        // font size is divided by the same 1/globalScale factor so the whole box scales together.
        // The node body/glow above stay in world units — only the label is zoom-invariant.
        const effectiveFontSize = fontSize / globalScale;
        const padding = 3 / globalScale;
        const borderRadius = 3 / globalScale;
        const verticalGap = 3 / globalScale;

        const isLightTheme = theme === 'light';
        // Purple label background when the node is click-selected OR hovered; otherwise keep the
        // theme-based near-black/white scheme unchanged. isHighlighted computed above the visibility
        // check.
        const bgColor = isHighlighted ? '#a05fdd' : (isLightTheme ? '#ffffff' : 'rgba(0, 0, 0, 0.94)');
        const textColor = isLightTheme ? '#000000' : '#ffffff';

        ctx.font = `${effectiveFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textY = node.y + baseSize + verticalGap + (effectiveFontSize / 2);
        const textWidth = ctx.measureText(label).width;
        const labelWidth = textWidth + padding * 2;
        const labelHeight = effectiveFontSize * 1.25 + padding * 0.4;
        const labelX = node.x - labelWidth / 2;
        const labelY = textY - labelHeight / 2;

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.moveTo(labelX + borderRadius, labelY);
        ctx.lineTo(labelX + labelWidth - borderRadius, labelY);
        ctx.quadraticCurveTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + borderRadius);
        ctx.lineTo(labelX + labelWidth, labelY + labelHeight - borderRadius);
        ctx.quadraticCurveTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - borderRadius, labelY + labelHeight);
        ctx.lineTo(labelX + borderRadius, labelY + labelHeight);
        ctx.quadraticCurveTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - borderRadius);
        ctx.lineTo(labelX, labelY + borderRadius);
        ctx.quadraticCurveTo(labelX, labelY, labelX + borderRadius, labelY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.fillText(label, node.x, textY);
      }

      if (isDimmed) {
        ctx.globalAlpha = 1;
      }
    }, [
      sizeBy, nodeSizeValue, colorBy, showLabels, showPrunable, hideOrphans,
      searchNodeId, hoveredNode, theme, filteredGraphData, isNodeDeemphasized, highlightSet, calculateNodeColour,
    ]);

    const stableNodePointerAreaPaint = useStableCallback((node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const size = getNodeSizeValue(node);
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    });

    const stableOnRenderFramePre = useStableCallback(() => {
      orphanCircleDrawn2DRef.current = false;
    });

    return (
      loadingDepthNodes || dataLoader ? (
        <div className='flex w-full h-full'>
          <div className={classNames(getCanvasShellClass(theme), 'flex items-center justify-center')}>
            {linkgraphDomains() ? (
              <ThinkingLoader width={93} height={150} />
            ) : (
              <Loader2 className='animate-spin' size={50} color='#7f4ead' />
            )}
          </div>
        </div>
      ) : (!dataLoader && depthNodesData.nodes?.length) ? (
        <div className='flex w-full h-full'>
          <div
            id='3d-graph'
            ref={canvasWrapperRef}
            // touch-none (3D only): belt-and-suspenders alongside the touchmove guard below —
            // stops the browser from ever treating a two-finger touch here as native page
            // pinch-zoom, so the gesture is free to reach OrbitControls' own dolly handling.
            className={classNames(getCanvasShellClass(theme), type === 4 && 'touch-none')}
            // react-force-graph only clears node hover via its own internal canvas raycasting
            // (a mousemove that ray-misses every node) — it never fires on a native leave event.
            // Moving off the canvas fast enough, or onto the settings-panel overlay stacked on
            // top of it (see the onMouseEnter below), skips that final miss entirely, so the last
            // hovered node's highlight/glow gets stuck rendered. Force-clear on leave instead of
            // relying on the library to notice.
            //
            // The enter/leave pair also maintains isPointerInsideCanvasRef so handleNodeHover can
            // discard a hover-IN the library's throttled raycast fires AFTER the cursor has already
            // left (the fast move-and-exit race). onMouseLeave does not fire when moving onto a
            // descendant overlay, so the flag correctly stays true while over those panels (they
            // clear hover via their own onMouseEnter below).
            onMouseEnter={() => {
              isPointerInsideCanvasRef.current = true;
            }}
            onMouseLeave={() => {
              isPointerInsideCanvasRef.current = false;
              handleNodeHover(null);
            }}
          >
            {/* No settling scrim: an overlay that fails to clear blocks the whole UI, which is far
                worse than briefly seeing nodes settle. The graph is framed once it settles (see
                frameSettledGraph) rather than masked. */}
            <div
              className={LEFT_OVERLAY_STACK_CLASS}
              // Stacked on top of the canvas inside the same #3d-graph wrapper, so entering this
              // overlay is a move to a DESCENDANT of canvasWrapperRef, not a leave — the
              // onMouseLeave above never fires for it. Clear hover explicitly on entry instead.
              onMouseEnter={() => handleNodeHover(null)}
            >
              {/* In-canvas Display Settings panel and color legend removed. */}
            </div>

            {showWatermark && (
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] max-w-[500px] pointer-events-none z-10 flex items-center justify-center' style={{opacity: WATERMARK_CONFIG?.opacity}}>
                <img
                  src={WATERMARK_CONFIG.getLogoPath(theme, watermarkLogoUrl)}
                  alt=''
                  className='w-full h-auto'
                />
              </div>
            )}

            <div
              className={ZOOM_CONTAINER_CLASS}
              // Stacked on top of the canvas inside #3d-graph — a descendant, not a leave, of the
              // wrapper's onMouseLeave (same gap the settings-panel overlay had; see its comment).
              onMouseEnter={() => handleNodeHover(null)}
            >
              <button className={zoomBtnTopClass} onClick={handleZoomIn} title='Zoom in'><FontAwesomeIcon icon={faPlus} fontSize={14} /></button>
              <button className={zoomBtnMiddleClass} onClick={handleZoomOut} title='Zoom out'><FontAwesomeIcon icon={faMinus} fontSize={14} /></button>
              <button className={zoomBtnBottomClass} onClick={zoomFitHandler} title='Zoom to fit'><FontAwesomeIcon icon={faArrowsToDot} fontSize={14} /></button>
            </div>

            <div
              className={getDetailDrawerWrapClass(!!selectedNodeDetail)}
              // Same descendant-of-#3d-graph gap as the settings panel / zoom controls above.
              onMouseEnter={() => handleNodeHover(null)}
            >
              {selectedNodeDetail && (() => {
                const summary = getNodeColorBySummary(selectedNodeDetail, colorBy);
                const ringCenter = summary.displayValue ?? summary.ringPercent;
                const title = selectedNodeDetail.name || selectedNodeDetail.h1Header || selectedNodeDetail.url || 'Untitled page';
                return (
                  <div className={getDetailDrawerPanelClass(isDark)}>
                    <div className={classNames('flex items-start gap-2.5 py-4 px-[18px] border-b', isDark ? 'border-[#24262F]' : 'border-[#E6E6EA]')}>
                      <div className={classNames('text-[17px] font-semibold break-words flex-1', isDark ? 'text-[#F3F3F7]' : 'text-[#141414]')}>{title}</div>
                      <button
                        type='button'
                        className={classNames('ml-auto shrink-0 bg-transparent border-0 cursor-pointer text-base', isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]')}
                        onClick={clearSelectedNodeDetail}
                        aria-label='Close node details'
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                    <div className='p-[18px] overflow-y-auto flex-1'>
                      <div className={classNames('font-mono text-[11.5px] break-all rounded-[7px] border border-solid py-[7px] px-[9px] mb-[18px]', isDark ? 'bg-[#1A1B24] border-[#24262F] text-[#A7A9B4]' : 'bg-[#F7F7FB] border-[#E6E6EA] text-[#4E5156]')}>
                        {selectedNodeDetail.url}
                      </div>
                      <div className='flex items-center gap-3.5 mb-[18px]'>
                        {summary.ringPercent !== null ? (
                          <div
                            className='w-[62px] h-[62px] rounded-full shrink-0 flex items-center justify-center relative'
                            style={{background: `conic-gradient(${summary.color} ${summary.ringPercent * 3.6}deg, ${isDark ? '#1A1B24' : '#F7F7FB'} 0)`}}
                          >
                            <span className={classNames('font-bold', summary.displayValue !== null ? 'text-xs' : 'text-lg', isDark ? 'text-[#F3F3F7]' : 'text-[#141414]')}>{ringCenter}</span>
                          </div>
                        ) : (
                          <span className='w-[11px] h-[11px] rounded-full shrink-0' style={{backgroundColor: summary.color, boxShadow: `0 0 8px ${summary.color}`}} />
                        )}
                        <div>
                          <div className={classNames('text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]')}>{summary.title}</div>
                          <div className='text-[15px] font-bold' style={{color: summary.color}}>{summary.bandLabel}</div>
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-2.5'>
                        <div className={getDetailStatTileClass(isDark)}>
                          <div className={classNames('text-xl font-bold', isDark ? 'text-[#F3F3F7]' : 'text-[#141414]')}>{selectedNodeDetail.depth ?? '-'}</div>
                          <div className={classNames('text-[11.5px]', isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]')}>Level</div>
                        </div>
                        <div className={getDetailStatTileClass(isDark)}>
                          <div className={classNames('text-xl font-bold', isDark ? 'text-[#F3F3F7]' : 'text-[#141414]')}>{selectedNodeDetail.wordCount ?? '-'}</div>
                          <div className={classNames('text-[11.5px]', isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]')}>Detail</div>
                        </div>
                        <div className={getDetailStatTileClass(isDark)}>
                          <div className='text-xl font-bold text-[#27AE60]'>{selectedNodeDetail.traffic ?? '-'}</div>
                          <div className={classNames('text-[11.5px]', isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]')}>Usage</div>
                        </div>
                        <div className={getDetailStatTileClass(isDark)}>
                          <div className='text-xl font-bold text-[#88c2ff]'>{selectedNodeDetail.keywords ?? '-'}</div>
                          <div className={classNames('text-[11.5px]', isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]')}>Related</div>
                        </div>
                      </div>
                    </div>
                    <div className={classNames('flex gap-2.5 py-3.5 px-[18px] border-t', isDark ? 'border-[#24262F]' : 'border-[#E6E6EA]')}>
                      <button
                        type='button'
                        className='flex-1 h-[38px] rounded-[9px] border-0 bg-brand-primary text-white text-[13px] font-semibold cursor-pointer'
                        onClick={focusSelectedNodeDetail}
                      >
                        Focus node
                      </button>
                      {selectedNodeDetail.url && (
                        <a
                          href={sanitizeUrl(selectedNodeDetail.url)}
                          target='_blank'
                          rel='noopener noreferrer'
                          className={classNames('flex-1 h-[38px] rounded-[9px] border border-solid text-[13px] font-semibold flex items-center justify-center', isDark ? 'bg-[#1A1B24] border-[#24262F] text-[#F3F3F7]' : 'bg-[#F7F7FB] border-[#E6E6EA] text-[#141414]')}
                        >
                          Open page
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {isBrowser() && filteredGraphData.nodes?.length && (type === 4 || type === 5) && (!forceGraphsReady || !ForceGraph2D || !ForceGraph3D) && (
              <div className='absolute inset-0 flex items-center justify-center'>
                {linkgraphDomains() ? (
                  <ThinkingLoader width={93} height={150} />
                ) : (
                  <Loader2 className='animate-spin' size={50} color='#7f4ead' />
                )}
              </div>
            )}

            {isBrowser() && filteredGraphData.nodes?.length && type === 4 && forceGraphsReady && ForceGraph3D && (
              <ForceGraph3D
                key={graphKey}
                ref={fgRef}
                controlType='orbit'
                graphData={filteredGraphData}
                nodeId='id'
                width={graphWidth}
                height={graphHeight}
                nodeLabel={emptyNodeLabel}
                linkColor={getLinkColorWithOpacity}
                linkOpacity={1}
                onNodeHover={handleNodeHover}
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}
                linkWidth={getLinkWidth}
                backgroundColor='rgba(0,0,0,0)'
                onNodeDrag={onDrag}
                onNodeDragEnd={onDragEnd}
                nodeVal={getNodeVal}
                nodeRelSize={4}
                nodeColor={getNodeColor}
                nodeResolution={16}
                nodeOpacity={1}
                nodeThreeObject={nodeThreeObject}
                nodeThreeObjectExtend={false}
                enablePointerInteraction={true}
                linkVisibility={linkVisibility}
                linkDistance={getLinkDistance}
                showNavInfo={false}
                enableNodeDrag={true}
                enableNavigationControls={true}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                warmupTicks={0}
                cooldownTicks={300}
                onEngineTick={stableOnEngineTick}
                onEngineStop={stableOnEngineStop3d}
                nodePositionUpdate={stableNodePositionUpdate3d}
              />
            )}
            {isBrowser() && filteredGraphData.nodes?.length && type === 5 && forceGraphsReady && ForceGraph2D && (
              <ForceGraph2D
                key={graphKey}
                ref={fgRef}
                graphData={filteredGraphData}
                // Bounds the WHEEL as well as the +/- buttons, matching the prototype's 2D clamp.
                minZoom={MIN_ZOOM_2D}
                maxZoom={MAX_ZOOM_2D}
                nodeId='id'
                width={graphWidth}
                height={graphHeight}
                nodeLabel={emptyNodeLabel}
                linkOpacity={linkOpacityValue ?? 0.2}
                linkColor={getLinkColorWithOpacity}
                linkCurvature={LINK_CURVATURE_2D}
                onNodeHover={handleNodeHover}
                onNodeClick={handle2dNodeClick}
                linkWidth={getLinkWidth}
                backgroundColor='rgba(0,0,0,0)'
                onNodeDrag={onDrag}
                onNodeDragEnd={onDragEnd}
                onEngineStop={stableOnEngineStop2d}
                nodePositionUpdate={stableNodePositionUpdate2d}
                nodeCanvasObject={stableNodeCanvasObject}
                nodePointerAreaPaint={stableNodePointerAreaPaint}
                linkDistance={get2dLinkDistance}
                enableZoomInteraction={true}
                enablePanInteraction={true}
                enableNodeDrag={true}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                warmupTicks={0}
                cooldownTicks={300}
                onEngineTick={stableOnEngineTick2d}
                onRenderFramePre={stableOnRenderFramePre}
              />
            )}

            {/* Hover info-card. DOM overlay independent of canvas/WebGL, so it renders identically
                for both the 3D (type 4) and 2D (type 5) views whenever a node is hovered. Never
                intercepts pointer events meant for the graph underneath (pointer-events-none). */}
            {hoveredNode && hoverCardPos && (() => {
              const summary = getNodeColorBySummary(hoveredNode, 'pageHealth');
              const slug = getNodeUrlSlug(hoveredNode);
              const dotSeparatorClass = isDark ? 'text-[#4A4C57]' : 'text-[#C9C9CF]';
              return (
                <div
                  className={classNames(
                    'fixed z-[70] pointer-events-none rounded-[9px] border border-solid px-3 py-2 shadow-lg',
                    isDark ? 'bg-[#141520] border-[#24262F]' : 'bg-white border-[#E6E6EA]',
                  )}
                  style={{left: hoverCardPos.x, top: hoverCardPos.y}}
                >
                  <div className={classNames('text-[12.5px] font-semibold mb-1 break-all max-w-[200px]', isDark ? 'text-[#F3F3F7]' : 'text-[#141414]')}>
                    {slug}
                  </div>
                  <div className={classNames('flex items-center gap-1.5 text-[11px] whitespace-nowrap', isDark ? 'text-[#A7A9B4]' : 'text-[#4E5156]')}>
                    <span className='w-[8px] h-[8px] rounded-full shrink-0' style={{backgroundColor: summary.color}} />
                    <span>Health {summary.ringPercent}</span>
                    <span className={dotSeparatorClass}>·</span>
                    <span>Depth {hoveredNode.depth ?? '-'}</span>
                    <span className={dotSeparatorClass}>·</span>
                    <span>{hoveredInboundCount} in</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (!dataLoader && !depthNodesData.nodes?.length) && (
        <div className='flex items-center justify-center min-h-[400px]' style={{backgroundColor: themeColors.bg}}>
          <div className="font-['Geist_Sans',sans-serif] text-sm">
            <EmptyState className={theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'} />
          </div>
        </div>
      )
    );
  };
  /* eslint-disable new-cap */
  return FocusGraph();
});

