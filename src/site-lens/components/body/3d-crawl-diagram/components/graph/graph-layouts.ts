export interface ILayoutNode {
  id: number;
  url?: string;
  depth?: number;
  isOrphan?: boolean;
}

export interface ILayoutLink {
  source: number | {id: number};
  target: number | {id: number};
}

export interface ISpanningTree {
  parentOf: Map<number, number | null>;
  childrenOf: Map<number, number[]>;
}

export interface IRadialPosition {
  x: number;
  y: number;
}

export interface IRadialLayoutOptions {
  ringUnit: number;
}

// --- Orphan composition -----------------------------------------------------------------------
// Orphans (no inbound link) used to be parented under the root by buildSpanningTree, which put them
// ON the depth rings interleaved with real branches — that, not the cluster offset, is why they
// visually collided with the main graph. They are now excluded from the tree and packed into their
// own disc placed clear of the outermost ring, so separation is guaranteed by construction: every
// main node is within R_main of the origin and every orphan within R_orph of the disc centre, so a
// centre separation of R_main + R_orph + GAP leaves at least GAP between any two nodes.

// Node pitch inside the orphan disc, in ring units (0.26 * 115 = 30 = the previous hard-coded
// ORPHAN_CLUSTER_SPREAD, now scaling with link length instead of being fixed).
export const ORPHAN_PITCH_UNITS = 0.26;
// Vogel/hex packing constant: for a uniform disc of N points the nearest-neighbour spacing is
// 1.9046 * R / sqrt(N), so R = pitch * sqrt(N) / 1.9046.
export const ORPHAN_PACK_K = 0.525;
// Smallest disc radius, so a single orphan still reads as a group rather than a stray dot.
export const ORPHAN_RADIUS_FLOOR_UNITS = 0.6;
// Gap between the two discs, floored on ring units and on a fraction of the composition so it
// stays visible at every graph size.
export const ORPHAN_GAP_MIN_UNITS = 0.8;
export const ORPHAN_GAP_RATIO = 0.15;

/**
 * Radius of the packed orphan disc.
 * @param {number} count - number of orphan nodes
 * @param {number} ringUnit - linkLengthValue, the layout's base unit
 * @return {number} disc radius in world units
 */
export const getOrphanDiscRadius = (count: number, ringUnit: number): number => {
  const pitch = ORPHAN_PITCH_UNITS * ringUnit;
  const packed = count > 1 ? ORPHAN_PACK_K * pitch * Math.sqrt(count) : 0;
  return Math.max(packed, ORPHAN_RADIUS_FLOOR_UNITS * ringUnit);
};

/**
 * Gap to leave between the main graph and the orphan disc.
 * @param {number} mainRadius - radius of the main graph disc
 * @param {number} orphanRadius - radius of the orphan disc
 * @param {number} ringUnit - linkLengthValue
 * @return {number} gap in world units
 */
export const getOrphanGap = (mainRadius: number, orphanRadius: number, ringUnit: number): number =>
  Math.max(ORPHAN_GAP_MIN_UNITS * ringUnit, ORPHAN_GAP_RATIO * (mainRadius + orphanRadius));

/**
 * Positions for the orphan disc, laid out as a Vogel (phyllotaxis) spiral so density is uniform and
 * the outline is circular — which is what the dashed "Orphan Pages" ring already drawn around them
 * assumes. A square grid left corner nodes further out than the ring implied.
 * @param {number[]} orphanIds - orphan node ids
 * @param {number} centerX - disc centre x
 * @param {number} centerY - disc centre y
 * @param {number} ringUnit - linkLengthValue
 * @return {Map<number, IRadialPosition>} id -> position
 */
/**
 * 3D counterpart of computeOrphanDisc: orphans packed into their own compact BALL, so the group
 * reads as a second sphere clearly separate from the main graph.
 *
 * Positions use a Fibonacci spiral over shells of increasing radius — the same golden-angle
 * construction the main spherical layout uses, so the two groups look like they belong to one
 * visual language. Radius follows the cube root of the count (volume packing) rather than the
 * square root used for the 2D disc (area packing).
 *
 * Known and accepted: because the ball is offset off-axis, it passes in front of / behind the main
 * sphere as the scene auto-rotates. Keeping both groups compact and legible was preferred over an
 * on-axis placement that would hold a constant gap but read as a less obvious "second ball".
 * @param {number[]} orphanIds - orphan node ids
 * @param {IVector3Like} centre - ball centre
 * @param {number} ringUnit - linkLengthValue
 * @return {Map<number, ISphericalPosition>} id -> position
 */
export const computeOrphanBall = (
  orphanIds: number[],
  centre: IVector3Like,
  ringUnit: number,
): Map<number, ISphericalPosition> => {
  const positions = new Map<number, ISphericalPosition>();
  const n = orphanIds.length;
  if (!n) return positions;
  if (n === 1) {
    positions.set(orphanIds[0], {x: centre.x, y: centre.y, z: centre.z});
    return positions;
  }
  const packRadius = getOrphanBallRadius(n, ringUnit);
  orphanIds.forEach((id, k) => {
    // Even distribution over the ball: cube-root radial spacing keeps density uniform, the
    // golden-angle spiral spreads directions evenly over each shell.
    const t = (k + 0.5) / n;
    const r = packRadius * Math.cbrt(t);
    const phi = Math.acos(1 - 2 * t);
    const theta = k * GOLDEN_ANGLE;
    positions.set(id, {
      x: centre.x + r * Math.sin(phi) * Math.cos(theta),
      y: centre.y + r * Math.sin(phi) * Math.sin(theta),
      z: centre.z + r * Math.cos(phi),
    });
  });
  return positions;
};

/**
 * Radius of the packed orphan ball. Cube-root growth (volume) vs the disc's square-root (area).
 * @param {number} count - number of orphan nodes
 * @param {number} ringUnit - linkLengthValue
 * @return {number} ball radius in world units
 */
export const getOrphanBallRadius = (count: number, ringUnit: number): number => {
  const pitch = ORPHAN_PITCH_UNITS * ringUnit;
  const packed = count > 1 ? ORPHAN_PACK_K * pitch * Math.cbrt(count) * 1.4 : 0;
  return Math.max(packed, ORPHAN_RADIUS_FLOOR_UNITS * ringUnit);
};

export const computeOrphanDisc = (
  orphanIds: number[],
  centerX: number,
  centerY: number,
  ringUnit: number,
): Map<number, IRadialPosition> => {
  const positions = new Map<number, IRadialPosition>();
  const n = orphanIds.length;
  if (!n) return positions;
  if (n === 1) {
    positions.set(orphanIds[0], {x: centerX, y: centerY});
    return positions;
  }
  const pitch = ORPHAN_PITCH_UNITS * ringUnit;
  const packRadius = ORPHAN_PACK_K * pitch * Math.sqrt(n);
  orphanIds.forEach((id, k) => {
    const theta = k * GOLDEN_ANGLE;
    const r = packRadius * Math.sqrt((k + 0.5) / n);
    positions.set(id, {x: centerX + Math.cos(theta) * r, y: centerY + Math.sin(theta) * r});
  });
  return positions;
};

export interface ISphericalPosition {
  x: number;
  y: number;
  z: number;
}

export interface ISphericalLayoutOptions {
  clustered: boolean;
  ringUnit: number;
  // Effective visual radius of a single node sphere (all nodes share one constant radius). Used
  // purely for collision avoidance: no two nodes ANYWHERE in the graph (not just siblings) may end
  // up closer than 2*nodeRadius (their combined radii) or their spheres would visually overlap.
  // Optional/0 disables the check, leaving the raw golden-angle spiral distribution untouched.
  nodeRadius?: number;
}

const HOME_TOPIC_KEY = 'home';
const RING_RADIUS_BUCKETS = [0, 2.3, 5.2, 7.6];
const START_ANGLE = -Math.PI / 2;
const FULL_CIRCLE = Math.PI * 2 * 0.985;

export const getEndpointId = (endpoint: number | {id: number}): number => {
  if (typeof endpoint === 'number') return endpoint;
  return endpoint.id;
};

interface ICandidateParent {
  parentId: number;
  parentDepth: number;
}

/**
 * Derives one canonical parent per node (turning the crawl graph into a tree) via each node's
 * already-trusted `depth` field. Two tiers: an edge a->b is preferred as a tree edge when depth(b)
 * is exactly depth(a)+1 (the normal case); if a node has NO such exact match — real crawl data
 * sometimes has a depth "gap" relative to a specific link, e.g. a page whose site-wide shortest
 * crawl-depth is 3 hops from home, but which is also linked directly from a page only 1 hop from
 * home, skipping depth 2 entirely — it falls back to the shallower endpoint of ANY link where
 * depth increases, preferring whichever candidate's depth is closest to the node's own (so a
 * closer real link always wins over a distant one, e.g. root itself, even though root also
 * qualifies once depth-gap fallback is in play). Ties broken by lowest node id at both tiers.
 * Nodes with no valid candidate at all (true orphans) attach directly under the root.
 * @param {ILayoutNode[]} nodes - all nodes in the current (filtered) graph
 * @param {ILayoutLink[]} links - all links in the current (filtered) graph
 * @return {ISpanningTree} parent/children maps keyed by node id
 */
export const buildSpanningTree = (nodes: ILayoutNode[], links: ILayoutLink[]): ISpanningTree => {
  const parentOf = new Map<number, number | null>();
  const childrenOf = new Map<number, number[]>();
  if (!nodes.length) return {parentOf, childrenOf};

  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const root = nodes.find(n => (n.depth ?? 0) === 0) ?? nodes[0];

  const exactCandidates = new Map<number, ICandidateParent[]>();
  const looseCandidates = new Map<number, ICandidateParent[]>();
  const addCandidate = (map: Map<number, ICandidateParent[]>, childId: number, parentId: number, parentDepth: number) => {
    const existing = map.get(childId);
    if (existing) {
      existing.push({parentId, parentDepth});
    } else {
      map.set(childId, [{parentId, parentDepth}]);
    }
  };

  for (const link of links) {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    const sourceNode = nodeById.get(sourceId);
    const targetNode = nodeById.get(targetId);
    if (!sourceNode || !targetNode || sourceId === targetId) continue;
    const sourceDepth = sourceNode.depth ?? 0;
    const targetDepth = targetNode.depth ?? 0;
    if (targetDepth === sourceDepth + 1) {
      addCandidate(exactCandidates, targetId, sourceId, sourceDepth);
    } else if (sourceDepth === targetDepth + 1) {
      addCandidate(exactCandidates, sourceId, targetId, targetDepth);
    } else if (targetDepth > sourceDepth) {
      addCandidate(looseCandidates, targetId, sourceId, sourceDepth);
    } else if (sourceDepth > targetDepth) {
      addCandidate(looseCandidates, sourceId, targetId, targetDepth);
    }
  }

  parentOf.set(root.id, null);
  for (const node of nodes) {
    if (node.id === root.id) continue;
    const exact = exactCandidates.get(node.id);
    let parentId: number;
    if (exact?.length) {
      parentId = Math.min(...exact.map(c => c.parentId));
    } else {
      const loose = looseCandidates.get(node.id);
      if (loose?.length) {
        const closestDepth = Math.max(...loose.map(c => c.parentDepth));
        parentId = Math.min(...loose.filter(c => c.parentDepth === closestDepth).map(c => c.parentId));
      } else {
        parentId = root.id;
      }
    }
    parentOf.set(node.id, parentId);
  }

  for (const node of nodes) {
    if (node.id === root.id) continue;
    const parentId = parentOf.get(node.id) as number;
    const siblings = childrenOf.get(parentId);
    if (siblings) {
      siblings.push(node.id);
    } else {
      childrenOf.set(parentId, [node.id]);
    }
  }

  return {parentOf, childrenOf};
};

/**
 * Recursively counts each node's descendant leaves (memoized), used to size angular wedges
 * proportionally in the radial layouts so subtrees with more pages get more arc.
 * @param {number[]} nodeIds - every node id present in the tree
 * @param {Map<number, number[]>} childrenOf - children map from buildSpanningTree
 * @return {Map<number, number>} leaf-descendant count per node id
 */
export const computeLeafCounts = (nodeIds: number[], childrenOf: Map<number, number[]>): Map<number, number> => {
  const leafCount = new Map<number, number>();

  const count = (id: number): number => {
    const cached = leafCount.get(id);
    if (cached !== undefined) return cached;
    const children = childrenOf.get(id);
    if (!children?.length) {
      leafCount.set(id, 1);
      return 1;
    }
    let total = 0;
    for (const childId of children) total += count(childId);
    leafCount.set(id, total);
    return total;
  };

  for (const id of nodeIds) count(id);
  return leafCount;
};

interface ITopicKeySource {
  url?: string;
  depth?: number;
}

/**
 * Extracts the first URL path segment (e.g. "/blog/my-post" -> "blog") to use as a proxy "topic"
 * for grouping in Topic-clustered radial — no real topic field exists on INodeData today.
 * @param {ITopicKeySource} node - a graph node
 * @return {string} a stable, lowercase grouping key
 */
export const getTopicKey = (node: ITopicKeySource): string => {
  if (!node.url || (node.depth ?? 0) === 0) return HOME_TOPIC_KEY;
  const match = node.url.match(/^https?:\/\/(?:www\.)?[^/]+\/([^/]+)/i);
  return match?.[1]?.toLowerCase() || HOME_TOPIC_KEY;
};

// Per-level step increments derived from the ring-radius buckets. Only used by getRingRadius below
// (the 2D radial layout) to keep extending rings outward past the bucket table. The 3D
// computeSphericalLayout no longer uses a depth-varying step at all — it now uses one FLAT link
// length at every depth (see FLAT_LINK_LENGTH).
const LINK_LENGTH_BUCKETS = RING_RADIUS_BUCKETS.slice(1).map((r, i) => r - RING_RADIUS_BUCKETS[i]);

// Ring radius is purely a function of depth, measured from the ROOT (not the parent) — this is
// what makes every depth-N node sit on one shared circle, with strictly larger circles at every
// deeper level. Unlike the old bucket lookup, this NEVER clamps: depths beyond the bucket table
// keep stepping outward by the last increment forever, so a depth-5 ring is still strictly outside
// a depth-4 ring, etc. — rings can never collapse together or cross at any depth.
export const getRingRadius = (depth: number, ringUnit: number): number => {
  if (depth <= 0) return 0;
  const lastBucketIndex = RING_RADIUS_BUCKETS.length - 1;
  if (depth <= lastBucketIndex) return RING_RADIUS_BUCKETS[depth] * ringUnit;
  const overshoot = depth - lastBucketIndex;
  const lastIncrement = LINK_LENGTH_BUCKETS[LINK_LENGTH_BUCKETS.length - 1];
  return (RING_RADIUS_BUCKETS[lastBucketIndex] + lastIncrement * overshoot) * ringUnit;
};

// A node's own children window is capped to this half-angle around the node's own ring angle,
// regardless of how wide a wedge the node itself inherited. This is no longer needed to keep
// children on the correct ring (radius is now purely depth-based, so that's automatic) — it's to
// stop the CONNECTING LINE between a node and a far-flung child from visually swinging back near
// the center when a node inherited a very wide wedge (e.g. root has few/lopsided children).
const MAX_CHILD_HALF_ANGLE = (Math.PI / 2) * 0.9;

// Absolute cap on the padding gap reserved around a node's children wedge, in radians (~8.6deg).
// The padding is normally a % of the wedge width, but without this cap a leaf-count-weighted wide
// wedge (a node with lots of children) would reserve a proportionally huge empty gap around
// itself, next to childless siblings' much tighter, narrow-wedge gaps.
const MAX_WEDGE_PADDING = 0.15;

/**
 * Computes fixed {x, y} positions for the radial-fan layout: every node at depth N sits on ONE
 * shared circle of radius getRingRadius(N), centered on the root — never the world origin plus a
 * per-parent offset. Because radius is purely a function of depth and strictly increases with
 * depth (no clamping, however deep the tree goes), a shallower ring can never be crossed or
 * touched by a deeper one, and no node can ever end up closer to the root than its own parent —
 * both guaranteed by construction, not by an angular check. Each subtree still owns an angular
 * wedge sized by its leaf count (a sibling with a bigger subtree gets a wider wedge), and a node's
 * own children are additionally kept within MAX_CHILD_HALF_ANGLE of the node's own ring angle so
 * the connecting line to a far-flung child doesn't visually swing back past the center.
 * @param {ILayoutNode[]} nodes - all nodes in the current (filtered) graph
 * @param {ILayoutLink[]} links - all links in the current (filtered) graph
 * @param {IRadialLayoutOptions} options - the ring-radius unit (linkLengthValue)
 * @return {Map<number, IRadialPosition>} target {x, y} per node id
 */
export const computeRadialLayout = (
  nodes: ILayoutNode[],
  links: ILayoutLink[],
  options: IRadialLayoutOptions,
): Map<number, IRadialPosition> => {
  const {ringUnit} = options;
  const positions = new Map<number, IRadialPosition>();
  if (!nodes.length) return positions;

  // Orphans are laid out separately (see computeOrphanDisc). Excluding them from the spanning tree
  // is the whole point: as root children they were placed on the depth rings among real branches
  // AND consumed the root's angular budget, so they both collided with and distorted the main fan.
  const mainNodes = nodes.filter(n => !n.isOrphan);
  const orphanNodes = nodes.filter(n => n.isOrphan);
  const layoutNodes = mainNodes.length ? mainNodes : nodes;
  const mainIds = new Set(layoutNodes.map(n => n.id));
  const layoutLinks = links.filter(
    l => mainIds.has(getEndpointId(l.source)) && mainIds.has(getEndpointId(l.target)),
  );

  const {childrenOf} = buildSpanningTree(layoutNodes, layoutLinks);
  const leafCount = computeLeafCounts(layoutNodes.map(n => n.id), childrenOf);
  const root = layoutNodes.find(n => (n.depth ?? 0) === 0) ?? layoutNodes[0];

  const place = (nodeId: number, angleStart: number, angleEnd: number, depth: number) => {
    const mid = (angleStart + angleEnd) / 2;
    const radius = getRingRadius(depth, ringUnit);
    positions.set(nodeId, {x: Math.cos(mid) * radius, y: Math.sin(mid) * radius});

    const children = childrenOf.get(nodeId);
    if (!children?.length) return;
    const totalLeaves = leafCount.get(nodeId) ?? children.length;
    // Padding is a % of the wedge, but capped to an absolute max — otherwise a node with a wide,
    // leaf-count-weighted wedge (i.e. one with lots of children) reserves a proportionally huge
    // empty gap around itself compared to its childless neighbors' tight, narrow-wedge gaps.
    const padding = Math.min((angleEnd - angleStart) * (depth >= 1 ? 0.18 : 0.12), MAX_WEDGE_PADDING);
    const usableHalf = Math.min(((angleEnd - angleStart) - padding) / 2, MAX_CHILD_HALF_ANGLE);
    const usable = usableHalf * 2;
    let cursor = mid - usableHalf;
    for (const childId of children) {
      const span = usable * ((leafCount.get(childId) ?? 1) / totalLeaves);
      place(childId, cursor, cursor + span, depth + 1);
      cursor += span;
    }
  };

  // Appends the orphan disc, placed clear of the main graph's outermost ring. The root stays at the
  // origin — the composition is balanced by the CAMERA (see the analytic framing in index.tsx),
  // not by translating nodes, so everything else that assumes an origin-anchored root still holds.
  const withOrphanDisc = (mainPositions: Map<number, IRadialPosition>): Map<number, IRadialPosition> => {
    if (!orphanNodes.length) return mainPositions;
    let mainRadius = 0;
    mainPositions.forEach(p => {
      mainRadius = Math.max(mainRadius, Math.hypot(p.x, p.y));
    });
    const orphanRadius = getOrphanDiscRadius(orphanNodes.length, ringUnit);
    const gap = getOrphanGap(mainRadius, orphanRadius, ringUnit);
    const separation = mainRadius + orphanRadius + gap;
    computeOrphanDisc(orphanNodes.map(n => n.id), separation, 0, ringUnit).forEach((p, id) => {
      mainPositions.set(id, p);
    });
    return mainPositions;
  };

  positions.set(root.id, {x: 0, y: 0});
  const rootChildren = childrenOf.get(root.id) ?? [];
  if (!rootChildren.length) return withOrphanDisc(positions);

  const totalLeaves = leafCount.get(root.id) ?? rootChildren.length;
  let cursor = START_ANGLE;
  for (const childId of rootChildren) {
    const span = FULL_CIRCLE * ((leafCount.get(childId) ?? 1) / totalLeaves);
    place(childId, cursor, cursor + span, 1);
    cursor += span;
  }
  return withOrphanDisc(positions);
};

// Golden-angle spiral increment — the standard constant for generating evenly-spaced points on
// (or within a cap of) a sphere, same idea as the 2D layout's angular wedge but in 3D.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Flat per-level link length: in the 3D spherical layout EVERY parent -> child step is the SAME
// distance regardless of depth (unlike the old depth-varying getLinkLength bucket lookup).
const FLAT_LINK_LENGTH = 2.3;

// Deliberate, scoped EXCEPTION to the "flat link length for every node" principle stated on
// FLAT_LINK_LENGTH above and in computeSphericalLayout's docstring (property 1) / the 2D
// getRingRadius/computeRadialLayout notes: a node X's OWN distance from ITS OWN parent is multiplied
// by this factor when BOTH hold: (a) X is itself a child of another node — i.e. X is NOT the root, it
// has a parent — AND (b) X has MORE THAN ONE direct child of its own (childrenOf.get(X).length > 1).
// This is purely about X's OWN direct child count, not grandchildren: a node with no children, exactly
// one child, or (the root, which has no parent-distance concept) keeps the normal 1x flat length. This
// gives non-leaf branch nodes that fan out into multiple children extra room to spread them. It is NOT
// a bug despite appearing to contradict the flat-length invariant documented elsewhere in this file: it
// layers ON TOP of the flat base, and sibling-widening, the parent-facing hole (alpha_hole), and global
// collision-avoidance all still apply to the resulting (possibly-multiplied) length.
const MULTI_CHILD_LINK_LENGTH_MULTIPLIER = 1.5;

// Padding factor shrinking each child's leaf-count-weighted cap so neighboring branches get visual
// breathing room instead of touching edge-to-edge. The cap itself is derived per-node from that
// node's share of its parent's cap (see naturalChildHalfAngle). NOTE: as of the full-sphere
// redesign the spherical layout places every node's children over a complete sphere (capAngle =
// PI) with no directional bias, so this leaf-weighted cap is threaded down to preserve the
// proportional-area principle but no longer clips placement — see computeSphericalLayout.
const CHILD_CONE_PADDING = 0.65;

/**
 * The half-angle a SINGLE child's own cone may safely use when it takes a share of the container
 * cap proportional to that child's own descendant-leaf count — mirroring the 2D radial layout,
 * where each sibling's angular wedge is `usable * (childLeaves / totalLeaves)` rather than an equal
 * slice. The container cap of half-angle `containerHalfAngle` has area fraction of the full sphere
 * = (1 - cos(halfAngle)) / 2; the child is allotted that fraction weighted by
 * `childLeafCount / totalLeaves`, and this returns the half-angle of a cap of that allotted area.
 * Splitting proportionally (not equally) means a subtree-heavy sibling gets a proportionally wider
 * cone than a childless sibling sharing the same container, so a dense branch's descendants keep
 * enough room to continue outward from their own parent instead of spilling into a neighbor's cone.
 * @param {number} containerHalfAngle - half-angle (radians) of the cone being subdivided
 * @param {number} childLeafCount - this child's own descendant-leaf count
 * @param {number} totalLeaves - summed leaf count across ALL siblings sharing this container
 * @return {number} the half-angle (radians) this child's own cone may safely use
 */
const naturalChildHalfAngle = (containerHalfAngle: number, childLeafCount: number, totalLeaves: number): number => {
  if (totalLeaves <= childLeafCount) return containerHalfAngle;
  const containerAreaFraction = (1 - Math.cos(containerHalfAngle)) / 2;
  const perChildAreaFraction = containerAreaFraction * (childLeafCount / totalLeaves);
  return Math.acos(Math.max(-1, 1 - 2 * perChildAreaFraction));
};

interface IVector3Like {
  x: number;
  y: number;
  z: number;
}

/**
 * Generates `n` points evenly spread over a spherical ZONE `theta in [thetaMin, thetaMax]`, in local
 * cap-space where the zone's axis (theta = 0) is +Z. `thetaMin = 0` is a full cap from the pole;
 * `thetaMin > 0` excludes a polar hole (the parent-hole-exclusion case — see computeSphericalLayout).
 * `thetaMax = PI` makes the outer boundary the far (south) pole, i.e. a full sphere minus the hole.
 *
 * The polar angle uses an EQUAL-AREA (cos(theta)-linear) mapping rather than a linear `theta = t*cap`
 * one, so every point owns the SAME zone area and the minimum angular gap is a GUARANTEED (not merely
 * averaged) property. Because a spherical zone's area is proportional to cos(theta), spacing the points
 * uniformly in cos(theta) is what makes the area-per-point constant:
 *
 *   cos(theta_i) = cos(thetaMin) - (i + 0.5)/n * (cos(thetaMin) - cos(thetaMax))   for i = 0..n-1
 *   theta_i      = acos(clamp(cos(theta_i), -1, 1))
 *   phi_i        = i * GOLDEN_ANGLE
 *   point_i      = (sin(theta_i)*cos(phi_i), sin(theta_i)*sin(phi_i), cos(theta_i))
 *
 * The `+ 0.5` centers each point in its equal-area band, so index 0 sits just INSIDE the boundary at
 * thetaMin (never exactly on the hole edge) and index n-1 sits just inside thetaMax. Under this mapping
 * the guaranteed minimum angular gap is approximately
 *   d ~= sqrt(4*PI * (cos(thetaMin) - cos(thetaMax)) / (sqrt(3) * n))
 * (ideal-hexagonal-packing spacing over the zone area 2*PI*(cos(thetaMin) - cos(thetaMax))), which
 * computeSphericalLayout uses to derive the required shell radius in closed form.
 * @param {number} n - how many points to generate
 * @param {number} thetaMax - outer polar angle of the zone in radians (PI = out to the far pole)
 * @param {number} thetaMin - inner polar angle / excluded polar hole in radians (0 = full cap)
 * @return {IVector3Like[]} n unit vectors in cap-local space, ordered by increasing polar angle
 */
const fibonacciCapPoints = (n: number, thetaMax: number, thetaMin = 0): IVector3Like[] => {
  const points: IVector3Like[] = [];
  // cos is monotonically decreasing on [0, PI], so with thetaMin <= thetaMax we have
  // cosMin >= cosMax and the interpolation below stays within [cosMax, cosMin] ⊆ [-1, 1].
  const cosMin = Math.cos(Math.min(thetaMin, thetaMax));
  const cosMax = Math.cos(thetaMax);
  for (let i = 0; i < n; i++) {
    const cosTheta = cosMin - ((i + 0.5) / n) * (cosMin - cosMax);
    const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
    const phi = GOLDEN_ANGLE * i;
    const sinTheta = Math.sin(theta);
    points.push({
      x: sinTheta * Math.cos(phi),
      y: sinTheta * Math.sin(phi),
      z: Math.cos(theta),
    });
  }
  return points;
};

/**
 * Smallest Euclidean (chord) distance between any two of the given unit points. Used to detect the
 * closest pair of same-cap siblings BEFORE they're scaled out onto their real shell: because all
 * siblings sit on one shell of radius `length` from their parent, the real-world distance between
 * two siblings is exactly `length * chordDistance(theirUnitVectors)`, so the closest real pair is
 * `length * minPairwiseChord(points)`. A single deterministic O(n^2) pass over the already-generated
 * lattice points (no iteration/relaxation). Since the equal-area mapping in fibonacciCapPoints now
 * gives a closed-form GUARANTEED minimum gap, the shell radius is derived from that formula directly
 * (before generating points); this exact scan survives only as a cheap correctness BACKSTOP that
 * bumps the shell up in the rare case the asymptotic gap formula over-estimates the achievable gap
 * (small-n / boundary edge effects where a Fibonacci lattice falls slightly short of ideal hexagonal
 * packing). Returns Infinity for fewer than two points.
 * @param {IVector3Like[]} points - unit vectors from fibonacciCapPoints
 * @return {number} the minimum pairwise chord distance (Infinity if <2 points)
 */
const minPairwiseChord = (points: IVector3Like[]): number => {
  let min = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dz = points[i].z - points[j].z;
      const d = Math.hypot(dx, dy, dz);
      if (d < min) min = d;
    }
  }
  return min;
};

/**
 * Rigidly rotates a set of cap-local unit vectors (generated by fibonacciCapPoints, whose zone axis /
 * theta = 0 direction is +Z) so that their +Z pole aligns with an arbitrary unit `axis`. Rotation is
 * an isometry, so all pairwise chord distances (and hence minPairwiseChord) are preserved — only the
 * orientation changes. computeSphericalLayout uses this to point a non-root node's children lattice so
 * its excluded polar hole faces the node's OWN parent (axis == the "toward parent" direction).
 *
 * The math mirrors the final orthonormal-frame projection in tangentSpiralDirections (that function is
 * left untouched as it is part of the collision safety net); a local vector `p` maps to
 * `p.x*u + p.y*v + p.z*axis`, where {u, v, axis} is a right-handed orthonormal frame.
 * @param {IVector3Like[]} points - cap-local unit vectors with +Z as their pole
 * @param {IVector3Like} axis - unit direction the +Z pole should be rotated onto
 * @return {IVector3Like[]} the rotated unit vectors (same count, same pairwise distances)
 */
const rotatePointsToAxis = (points: IVector3Like[], axis: IVector3Like): IVector3Like[] => {
  // Orthonormal tangent frame {u, v} perpendicular to `axis`; the helper just has to be non-parallel
  // to `axis` so the cross product is well-defined — swap it near the poles.
  const helper = Math.abs(axis.z) < 0.9 ? {x: 0, y: 0, z: 1} : {x: 1, y: 0, z: 0};
  let ux = helper.y * axis.z - helper.z * axis.y;
  let uy = helper.z * axis.x - helper.x * axis.z;
  let uz = helper.x * axis.y - helper.y * axis.x;
  const uLen = Math.hypot(ux, uy, uz) || 1;
  ux /= uLen;
  uy /= uLen;
  uz /= uLen;
  const vx = axis.y * uz - axis.z * uy;
  const vy = axis.z * ux - axis.x * uz;
  const vz = axis.x * uy - axis.y * ux;

  return points.map(p => ({
    x: ux * p.x + vx * p.y + axis.x * p.z,
    y: uy * p.x + vy * p.y + axis.y * p.z,
    z: uz * p.x + vz * p.y + axis.z * p.z,
  }));
};

// Maximum outward nudges applied to a single node when resolving a GLOBAL collision (a would-be
// overlap with any already-placed node, not just a sibling). Each nudge steps the node one
// minSeparation further along its own direction-from-parent; a ray outward from the parent clears
// the finite set of placed nodes in a bounded number of steps, and this cap guarantees termination
// even in pathological packings (best-effort — the last position is accepted if the cap is hit).
// This distance-growing push is now only the LAST-RESORT fallback for the angle-first search below.
const MAX_COLLISION_NUDGES = 128;

// Angle-first collision search (see resolveCollisionByRotation). When a child's fixed-length position
// collides, we first try to ROTATE its direction — keeping the exact same parent distance — into a
// free slot, before ever growing the link. These bound that angular search deterministically: a few
// EXPANDING rings (from the child's own allotted cap out to a full sphere) times a fixed candidate
// count per ring. COLLISION_SEARCH_RINGS * COLLISION_CANDIDATES_PER_RING (= 64) is the hard cap on
// directions tried — no unbounded loop, no randomness.
// Typed as number (not the inferred literal) so the divide-by-zero guard for a single-ring config in
// resolveCollisionByRotation stays a legal comparison rather than a "no overlap" type error.
const COLLISION_SEARCH_RINGS: number = 4;
const COLLISION_CANDIDATES_PER_RING = 16;

/**
 * A minimal uniform spatial hash grid over 3D node positions, used to keep the GLOBAL
 * collision check (no two nodes anywhere closer than 2*nodeRadius) near-linear instead of O(n^2)
 * for graphs up to a few thousand nodes (see LARGE_GRAPH_NODE_THRESHOLD). Cell size equals the
 * min-separation query distance, so any node within that distance necessarily falls in one of the
 * 27 cells surrounding the query point — a fixed-cost neighborhood scan per lookup.
 */
interface ISpatialGrid {
  insert: (pos: ISphericalPosition) => void;
  hasNeighborWithin: (pos: ISphericalPosition, minDist: number) => boolean;
}

const createSpatialGrid = (cellSize: number): ISpatialGrid => {
  const cells = new Map<string, ISphericalPosition[]>();
  const keyOf = (x: number, y: number, z: number): string =>
    `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)},${Math.floor(z / cellSize)}`;

  return {
    insert: (pos: ISphericalPosition) => {
      const key = keyOf(pos.x, pos.y, pos.z);
      const bucket = cells.get(key);
      if (bucket) {
        bucket.push(pos);
      } else {
        cells.set(key, [pos]);
      }
    },
    hasNeighborWithin: (pos: ISphericalPosition, minDist: number): boolean => {
      const cx = Math.floor(pos.x / cellSize);
      const cy = Math.floor(pos.y / cellSize);
      const cz = Math.floor(pos.z / cellSize);
      // Relative tolerance so a pair sitting EXACTLY at minDist (e.g. the closest pair after the
      // sibling-set shell widening, which lands them at precisely minSeparation) is not counted as a
      // collision on a floating-point hair — only genuinely-closer pairs trigger a nudge.
      const minDistSq = minDist * minDist * (1 - 1e-9);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const bucket = cells.get(`${cx + dx},${cy + dy},${cz + dz}`);
            if (!bucket) continue;
            for (const other of bucket) {
              const ex = pos.x - other.x;
              const ey = pos.y - other.y;
              const ez = pos.z - other.z;
              if (ex * ex + ey * ey + ez * ez < minDistSq) return true;
            }
          }
        }
      }
      return false;
    },
  };
};

/**
 * Generates `count` candidate directions that perturb a unit `axis` by an increasing polar offset,
 * spread via the golden-angle spiral, all within `searchHalfAngle` of `axis` — the tangent-plane
 * analogue of fibonacciCapPoints, but rotated so the cap axis is an ARBITRARY direction instead of
 * +Z. Used by the angle-first collision search to look for a free slot at the SAME parent distance:
 * a colliding child keeps its fixed link length and only rotates its direction. Candidate k uses
 * polar offset theta_k = sqrt(k / count) * searchHalfAngle (sqrt spacing = equal-area, so candidates
 * pack the cap evenly rather than bunching at the pole) and azimuthal offset phi_k = GOLDEN_ANGLE * k,
 * built in the cap-local +Z frame exactly like fibonacciCapPoints, then rotated onto `axis` via an
 * orthonormal tangent frame {u, v, axis}. Because theta_k increases monotonically with k, candidates
 * come out ordered by increasing angular offset from `axis`, so a caller taking the first free one
 * gets the closest / least-disruptive slot.
 * @param {IVector3Like} axis - the original unit direction to rotate around (== child's dir-from-parent)
 * @param {number} searchHalfAngle - max polar offset (radians) any candidate may sit from `axis`
 * @param {number} count - how many candidate directions to generate
 * @return {IVector3Like[]} `count` unit vectors, ordered by increasing angular offset from `axis`
 */
const tangentSpiralDirections = (axis: IVector3Like, searchHalfAngle: number, count: number): IVector3Like[] => {
  // Orthonormal tangent frame {u, v} perpendicular to `axis`. The helper axis just has to be
  // non-parallel to `axis` so the cross product is well-defined; swap it near the poles.
  const helper = Math.abs(axis.z) < 0.9 ? {x: 0, y: 0, z: 1} : {x: 1, y: 0, z: 0};
  let ux = helper.y * axis.z - helper.z * axis.y;
  let uy = helper.z * axis.x - helper.x * axis.z;
  let uz = helper.x * axis.y - helper.y * axis.x;
  const uLen = Math.hypot(ux, uy, uz) || 1;
  ux /= uLen;
  uy /= uLen;
  uz /= uLen;
  const vx = axis.y * uz - axis.z * uy;
  const vy = axis.z * ux - axis.x * uz;
  const vz = axis.x * uy - axis.y * ux;

  const directions: IVector3Like[] = [];
  for (let k = 1; k <= count; k++) {
    const theta = Math.sqrt(k / count) * searchHalfAngle;
    const phi = GOLDEN_ANGLE * k;
    const sinTheta = Math.sin(theta);
    // Offset in cap-local space (axis == +Z), same parametrization as fibonacciCapPoints.
    const ox = sinTheta * Math.cos(phi);
    const oy = sinTheta * Math.sin(phi);
    const oz = Math.cos(theta);
    // Rotate the local offset onto the real tangent frame: result = ox*u + oy*v + oz*axis.
    directions.push({
      x: ux * ox + vx * oy + axis.x * oz,
      y: uy * ox + vy * oy + axis.y * oz,
      z: uz * ox + vz * oy + axis.z * oz,
    });
  }
  return directions;
};

/**
 * Resolves a collision for a single child position using an ANGLE-FIRST strategy, keeping the
 * distance-growing radial push only as a last resort.
 *
 * Why angle-first: the child sits at a FIXED `length` from its parent along `dir`. The old
 * resolution pushed a colliding child straight OUTWARD along `dir` by `minSeparation` per step — but
 * a nudged node then becomes the position origin for ITS OWN children, so that extra distance is
 * inherited and COMPOUNDS level over level, producing visually exponential parent->child growth with
 * depth. Instead we first hunt for a free slot at the exact SAME `length`, only rotating `dir`:
 *   1. Fast path — if the un-rotated fixed-length position is already clear, use it untouched.
 *   2. Angle search — try candidate directions from tangentSpiralDirections in EXPANDING RINGS: the
 *      innermost ring is the child's own allotted cap (`capHalfAngle`), then the search half-angle
 *      widens in a few steps out to a full sphere (PI), since that proportional cap is a preference,
 *      not a hard clip (see the naturalChildHalfAngle note on no longer clipping placement).
 *      Candidates are tried in order of increasing angular offset, so the closest / least-disruptive
 *      free slot wins. The whole search is bounded by COLLISION_SEARCH_RINGS * candidates-per-ring.
 *   3. Fallback — only if NO rotated candidate anywhere clears the grid do we fall back to the
 *      original radial push along `dir` (distance as a genuine last resort), bounded by
 *      MAX_COLLISION_NUDGES. This is the unchanged pre-angle-first behavior, now secondary.
 * The returned position is NOT inserted into the grid — the caller inserts it.
 * @param {ISpatialGrid} grid - spatial index of all already-placed node positions
 * @param {ISphericalPosition} parentPos - the child's parent position (rotation origin)
 * @param {IVector3Like} dir - the child's original unit direction from its parent
 * @param {number} length - the FIXED parent->child distance (never changed by rotation)
 * @param {number} minSeparation - minimum allowed center-to-center distance (2 * nodeRadius)
 * @param {number} capHalfAngle - the child's own allotted cap half-angle (innermost search ring)
 * @return {ISphericalPosition} a collision-free position at `length` if rotation found one, else the
 *   radially-pushed fallback position (best-effort if the nudge cap is hit)
 */
const resolveCollisionByRotation = (
  grid: ISpatialGrid,
  parentPos: ISphericalPosition,
  dir: IVector3Like,
  length: number,
  minSeparation: number,
  capHalfAngle: number,
): ISphericalPosition => {
  const atDirection = (d: IVector3Like): ISphericalPosition => ({
    x: parentPos.x + d.x * length,
    y: parentPos.y + d.y * length,
    z: parentPos.z + d.z * length,
  });

  const basePos = atDirection(dir);
  // Fast path: the fixed-length position along the original direction is already clear.
  if (!grid.hasNeighborWithin(basePos, minSeparation)) return basePos;

  // Angle search: expanding rings from the child's own cap out to a full sphere, each a small
  // golden-angle spiral of candidate directions at the SAME length. First collision-free slot wins.
  for (let ring = 0; ring < COLLISION_SEARCH_RINGS; ring++) {
    const t = COLLISION_SEARCH_RINGS === 1 ? 0 : ring / (COLLISION_SEARCH_RINGS - 1);
    const searchHalfAngle = capHalfAngle + (Math.PI - capHalfAngle) * t;
    const candidates = tangentSpiralDirections(dir, searchHalfAngle, COLLISION_CANDIDATES_PER_RING);
    for (const candidateDir of candidates) {
      const candidatePos = atDirection(candidateDir);
      if (!grid.hasNeighborWithin(candidatePos, minSeparation)) return candidatePos;
    }
  }

  // Last resort: the original distance-growing radial push along `dir`, bounded by
  // MAX_COLLISION_NUDGES. Only reached when no rotated slot anywhere is free, so the rare
  // compounding-distance case is contained to genuinely packed regions.
  let pushed = basePos;
  let nudges = 0;
  while (grid.hasNeighborWithin(pushed, minSeparation) && nudges < MAX_COLLISION_NUDGES) {
    pushed = {
      x: pushed.x + dir.x * minSeparation,
      y: pushed.y + dir.y * minSeparation,
      z: pushed.z + dir.z * minSeparation,
    };
    nudges++;
  }
  return pushed;
};

/**
 * Computes fixed {x, y, z} positions for the 3D equivalent of Radial Fan / Topic-clustered radial.
 * Three defining properties:
 *   1. FLAT link length (with one scoped exception) — every child sits the SAME base distance
 *      (FLAT_LINK_LENGTH * ringUnit) from its OWN parent, at every depth (no depth-varying step), so a
 *      depth chain steps outward by a constant amount per level. The single deliberate exception: a
 *      NON-ROOT node with MORE THAN ONE direct child of its own sits MULTI_CHILD_LINK_LENGTH_MULTIPLIER
 *      times that base from its own parent (see that constant) to give multi-child branch nodes extra
 *      fan-out room; the multiplier is evaluated per-node from its own direct child count and does not
 *      change any other node's distance. Sibling-widening / hole / global collision-avoidance below all
 *      still apply on top.
 *   2. FULL SPHERE MINUS A PARENT-FACING HOLE — a node's children scatter over an EQUAL-AREA lattice
 *      (see fibonacciCapPoints) covering the sphere out to theta = PI, so children may sit anywhere
 *      around their parent, including back toward the grandparent. For every NON-ROOT node with
 *      collision avoidance active, the polar zone near the direction back toward its OWN parent is
 *      EXCLUDED: the lattice's theta = 0 axis is oriented "toward parent" and a hole of half-angle
 *      alpha_hole = 2*asin(min(1, nodeRadius / lengthToOwnParent)) is carved out (theta_min =
 *      alpha_hole), so a child is never generated on top of the parent it hangs from. The ROOT (no
 *      parent) uses theta_min = 0 and the un-rotated +Z frame — root behavior is unchanged. The
 *      leaf-count-weighted per-child cap (naturalChildHalfAngle) is still threaded down to preserve
 *      its proportional-area principle, but does not clip placement.
 *   3. GLOBAL collision avoidance — when nodeRadius is supplied, NO two nodes anywhere in the graph
 *      (regardless of branch/depth/parent) are left closer than 2*nodeRadius. Mechanisms combine:
 *      a per-sibling-set shell radius derived in CLOSED FORM from the equal-area lattice's guaranteed
 *      minimum gap (with an exact minPairwiseChord scan retained as a cheap backstop for small-n edge
 *      effects), which keeps a crowded set's siblings on one consistent shell; the parent-facing hole
 *      above, which prevents most local parent/child overlaps by construction; and, as each node is
 *      placed, an ANGLE-FIRST resolution (see resolveCollisionByRotation) that, when a node's
 *      fixed-length position would overlap ANY already-placed node (via a spatial-hash grid), ROTATES
 *      its direction to a free slot at the SAME parent distance rather than pushing it outward — so
 *      link length (and therefore parent->child distance) never grows on collision in the common case,
 *      avoiding the compounding depth-over-depth distance growth a radial push caused. The lattice+hole
 *      only prevents LOCAL parent/child adjacency; the grid resolution remains the residual safety net
 *      for cross-branch and grandparent collisions it cannot structurally prevent. The distance-growing
 *      radial push survives only as a bounded last-resort fallback for genuinely packed regions where
 *      no rotated slot is free. Link/line crossings are not a concern — only node-to-node proximity.
 *      When nodeRadius is 0 the raw lattice positions are left untouched.
 * When `clustered` is true, same-topic depth-1 children are sorted adjacent to each other before
 * being assigned points — the golden-angle spiral places consecutive indices near each other in
 * space, so this reads as loose topic clustering without needing an explicit 3D angular gap.
 * @param {ILayoutNode[]} nodes - all nodes in the current (filtered) graph
 * @param {ILayoutLink[]} links - all links in the current (filtered) graph
 * @param {ISphericalLayoutOptions} options - clustered flag, the ring-radius unit (linkLengthValue),
 *   and the constant node radius used for global collision avoidance (nodeRadius; optional/0 leaves
 *   the raw spiral distribution untouched)
 * @return {Map<number, ISphericalPosition>} target {x, y, z} per node id
 */
export const computeSphericalLayout = (
  nodes: ILayoutNode[],
  links: ILayoutLink[],
  options: ISphericalLayoutOptions,
): Map<number, ISphericalPosition> => {
  const {clustered, ringUnit, nodeRadius = 0} = options;
  const positions = new Map<number, ISphericalPosition>();
  if (!nodes.length) return positions;

  // Same split as computeRadialLayout: orphans leave the spanning tree so they are neither placed
  // among the main shells nor consuming the root's angular budget, and are packed into their own
  // ball below.
  const mainNodes = nodes.filter(n => !n.isOrphan);
  const orphanNodes = nodes.filter(n => n.isOrphan);
  const layoutNodes = mainNodes.length ? mainNodes : nodes;
  const mainIds = new Set(layoutNodes.map(n => n.id));
  const layoutLinks = links.filter(
    l => mainIds.has(getEndpointId(l.source)) && mainIds.has(getEndpointId(l.target)),
  );

  const {childrenOf} = buildSpanningTree(layoutNodes, layoutLinks);
  const leafCount = computeLeafCounts(nodes.map(n => n.id), childrenOf);
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const root = layoutNodes.find(n => (n.depth ?? 0) === 0) ?? layoutNodes[0];
  // Two node spheres visually touch/overlap once their centers are closer than the sum of their
  // (equal, constant) radii. A single constant for all pairs because every node shares one radius.
  const minSeparation = 2 * nodeRadius;
  // Spatial index of ALL already-placed node positions, driving the global (cross-branch) collision
  // check. Only built when collision avoidance is active (minSeparation > 0); otherwise the raw
  // spiral positions are emitted untouched.
  const grid: ISpatialGrid | null = minSeparation > 0 ? createSpatialGrid(minSeparation) : null;

  const place = (
    nodeId: number,
    position: ISphericalPosition,
    depth: number,
    // Leaf-count-weighted cap this node was allotted out of its parent's cap. Threaded purely to
    // preserve the proportional-area principle for each generation (see naturalChildHalfAngle); it
    // no longer clips placement, which is now a full sphere (minus the parent hole) at every depth.
    containerHalfAngle: number,
    // This node's OWN parent position (null for the root), used to derive the "toward parent"
    // direction and the parent-hole half-angle for THIS node's children (see below).
    parentPosition: ISphericalPosition | null,
  ) => {
    const children = childrenOf.get(nodeId);
    if (!children?.length) return;

    const orderedChildren = clustered && depth === 0 ?
      [...children].sort((a, b) => {
        const topicCompare = getTopicKey(nodeById.get(a) ?? {}).localeCompare(getTopicKey(nodeById.get(b) ?? {}));
        return topicCompare !== 0 ? topicCompare : a - b;
      }) :
      children;

    // Parent-hole exclusion. For every NON-ROOT node (with collision avoidance active) we carve a
    // polar hole out of the children lattice around the direction back toward THIS node's own parent,
    // so no child is generated sitting on top of that parent. The hole half-angle is
    //   alpha_hole = 2 * asin(min(1, nodeRadius / lengthToOwnParent))
    // where lengthToOwnParent is THIS node's actual placed distance from its own parent (the flat
    // link length, or a widened value if this node's sibling set was widened). The min(1, ...) clamp
    // keeps asin finite in the degenerate nodeRadius >= lengthToOwnParent config. The lattice is then
    // oriented so its theta = 0 axis points along that "toward parent" direction. The ROOT keeps
    // theta_min = 0 and the un-rotated +Z frame (root behavior unchanged).
    let holeAngle = 0;
    let latticeAxis: IVector3Like | null = null;
    if (parentPosition && minSeparation > 0) {
      const towardParentX = parentPosition.x - position.x;
      const towardParentY = parentPosition.y - position.y;
      const towardParentZ = parentPosition.z - position.z;
      const lengthToOwnParent = Math.hypot(towardParentX, towardParentY, towardParentZ);
      if (lengthToOwnParent > 1e-9) {
        holeAngle = 2 * Math.asin(Math.min(1, nodeRadius / lengthToOwnParent));
        latticeAxis = {
          x: towardParentX / lengthToOwnParent,
          y: towardParentY / lengthToOwnParent,
          z: towardParentZ / lengthToOwnParent,
        };
      }
    }

    // Equal-area lattice over the sphere out to theta = PI, minus the parent hole [0, holeAngle].
    const capAngle = Math.PI;
    const localPoints = fibonacciCapPoints(orderedChildren.length, capAngle, holeAngle);
    // Orient the lattice so its polar hole faces this node's own parent (no-op for the root, whose
    // latticeAxis is null). Rotation is an isometry, so it preserves every pairwise distance.
    const points = latticeAxis ? rotatePointsToAxis(localPoints, latticeAxis) : localPoints;

    // Sibling-set shell radius. All children sit on one shell of radius `length` from this node, so
    // the closest real sibling pair is `length * (chord of their min angular gap)`. The equal-area
    // lattice makes that minimum gap a CLOSED-FORM property known BEFORE generating points:
    //   d ~= sqrt(4*PI * (cos(holeAngle) - cos(capAngle)) / (sqrt(3) * n))     (guaranteed min gap)
    //   R  = minSeparation / (2 * sin(d / 2))                                  (shell that lifts it to minSeparation)
    // We derive R directly from that and use it as the shell radius. Because a Fibonacci lattice falls
    // slightly short of ideal hexagonal packing (especially small n / near the zone boundary), the
    // asymptotic gap can be optimistic, so we ALSO keep the exact O(n^2) minPairwiseChord scan as a
    // cheap correctness backstop that bumps the shell up if the true closest pair is still too close.
    // Both are deterministic single calculations (no relaxation loop); the global grid pass below then
    // resolves any residual collision with NON-sibling nodes.
    let length = FLAT_LINK_LENGTH * ringUnit;
    if (minSeparation > 0 && orderedChildren.length > 1) {
      const guaranteedGap = Math.sqrt(
        (4 * Math.PI * (Math.cos(holeAngle) - Math.cos(capAngle))) / (Math.sqrt(3) * orderedChildren.length),
      );
      const closedFormChord = 2 * Math.sin(guaranteedGap / 2);
      if (closedFormChord > 1e-9) {
        const closedFormLength = minSeparation / closedFormChord;
        if (closedFormLength > length) length = closedFormLength;
      }
      const minChord = minPairwiseChord(points);
      if (minChord > 1e-9) {
        const requiredLength = minSeparation / minChord;
        if (requiredLength > length) length = requiredLength;
      }
    }
    // Total descendant-leaves across this node's children (== this node's own leaf count), used to
    // size each child's cap in proportion to its subtree (proportional-area principle), rather than
    // splitting the container equally among siblings.
    const totalLeaves = leafCount.get(nodeId) ?? orderedChildren.length;

    orderedChildren.forEach((childId, i) => {
      // points[i] is a unit vector and, since the lattice is only rigidly rotated onto the toward-parent
      // axis, also this child's direction from THIS parent — the axis the angle-first search rotates around.
      const dir = points[i];
      // The child's own leaf-count-weighted cap (see naturalChildHalfAngle). Threaded down as the cap
      // this child gives ITS OWN children, and reused here as the innermost (least-disruptive) search
      // ring: a colliding child prefers a free slot inside its own allotted cap before spilling wider.
      const childHalfAngle = naturalChildHalfAngle(containerHalfAngle, leafCount.get(childId) ?? 1, totalLeaves) * CHILD_CONE_PADDING;

      // Per-child link length: the sibling-set base shell radius `length` (flat base, already widened
      // by collision avoidance if active), scaled by MULTI_CHILD_LINK_LENGTH_MULTIPLIER for THIS child
      // specifically when it has MORE THAN ONE direct child of its own — the deliberate exception to the
      // flat-length principle (see that constant). The "non-root" half of that condition is satisfied by
      // construction: this runs only for nodes placed as someone's CHILD (the root is placed once,
      // separately, and never passes through here). Evaluated per child via a single O(1) childrenOf
      // lookup, so siblings with different child counts can sit at different distances from this shared
      // parent. The multiplier only ever pushes a node FARTHER out, so it never breaks the sibling
      // shell's collision guarantee; the parent-hole for THIS child's own children and the global grid
      // below both operate on this childLength.
      const childLength =
        (childrenOf.get(childId)?.length ?? 0) > 1 ? length * MULTI_CHILD_LINK_LENGTH_MULTIPLIER : length;

      let childPos: ISphericalPosition = {
        x: position.x + dir.x * childLength,
        y: position.y + dir.y * childLength,
        z: position.z + dir.z * childLength,
      };
      // Global collision resolution: if this fixed-length position would sit within minSeparation of
      // ANY already-placed node (sibling, ancestor, or a node in a completely different branch),
      // ROTATE the direction to a free slot at the SAME distance (angle-first), falling back to the
      // outward radial push only when no rotated slot is free. Keeping the distance fixed on
      // resolution is what stops the compounding parent->child growth with depth.
      if (grid) {
        childPos = resolveCollisionByRotation(grid, position, dir, childLength, minSeparation, childHalfAngle);
        grid.insert(childPos);
      }
      positions.set(childId, childPos);

      // `position` (this node) is the child's own parent — passed so the child can face its own
      // children's hole back toward here.
      place(childId, childPos, depth + 1, childHalfAngle, position);
    });
  };

  positions.set(root.id, {x: 0, y: 0, z: 0});
  grid?.insert({x: 0, y: 0, z: 0});
  place(root.id, {x: 0, y: 0, z: 0}, 0, Math.PI, null);

  // Orphan ball, offset clear of the main sphere. Root stays at the origin so the auto-rotate
  // pivot (GRAPH_ROTATION_CENTER) and the origin-centred starfield keep working unchanged.
  if (orphanNodes.length) {
    let mainRadius = 0;
    positions.forEach(p => {
      mainRadius = Math.max(mainRadius, Math.hypot(p.x, p.y, p.z));
    });
    const orphanRadius = getOrphanBallRadius(orphanNodes.length, ringUnit);
    const separation = mainRadius + orphanRadius + getOrphanGap(mainRadius, orphanRadius, ringUnit);
    // Offset along +X only. A single axis keeps the two groups reading as "main sphere, then the
    // orphan sphere beside it"; the previous diagonal (0.7, 0, 0.7) offset made the pairing harder
    // to read without buying any extra separation.
    computeOrphanBall(orphanNodes.map(n => n.id), {x: separation, y: 0, z: 0}, ringUnit)
      .forEach((p, id) => positions.set(id, p));
  }

  return positions;
};
