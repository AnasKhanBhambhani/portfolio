/**
 * Pure, THREE-free geometry helpers for the Site Lens 3D-view starfield background.
 * Kept dependency-free (no Three.js import) so the sampling math is trivially unit-testable
 * without mocking a WebGL/THREE runtime. The THREE.Points construction that consumes these
 * lives in the graph component's own effect.
 */

export interface IStarfieldRadiusRange {
  minRadius: number;
  maxRadius: number;
}

// Inner shell radius as a multiple of the main graph's `extent` (half-diagonal of the node
// cloud from getMainGraphBounds). Orphan clusters already sit at roughly `extent + ORPHAN_MAIN_GAP`
// from center, so a 4x inner radius keeps every star comfortably OUTSIDE both the node cloud and
// the orphan ring for any graph size.
const STAR_SHELL_MIN_FACTOR = 4;

// Absolute floor for the inner radius so a 1-2 node graph (extent ≈ 1, near zero) still gets a
// shell far enough out to read as a distant starfield rather than collapsing onto the nodes.
const STAR_SHELL_MIN_RADIUS = 800;

// Outer/inner radius ratio. Mirrors the reference prototype's own shell (1600 → 3800 ⇒ 2.375),
// giving the stars a sense of depth without becoming invisible specks on a large graph.
const STAR_SHELL_THICKNESS_RATIO = 2.375;

/**
 * Generates star positions on a spherical shell using uniform sphere-surface sampling
 * (theta uniform over 0..2π, phi via acos(2*rand-1) for even distribution instead of pole
 * clustering) with radius uniform between minRadius and maxRadius. Matches the reference math.
 * @param {number} count - number of stars to generate
 * @param {number} minRadius - inner shell radius (inclusive lower bound on distance from origin)
 * @param {number} maxRadius - outer shell radius (inclusive upper bound on distance from origin)
 * @return {Float32Array} flat x,y,z-interleaved array of length count * 3
 */
export const generateStarPositions = (
  count: number,
  minRadius: number,
  maxRadius: number,
): Float32Array => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  return positions;
};

/**
 * Computes the starfield shell radius range from the main graph's extent, scaling the shell so
 * stars always sit outside the node cloud regardless of graph size, with an absolute floor for
 * tiny/near-zero-extent graphs. Always returns minRadius < maxRadius (never degenerate).
 * @param {number} graphExtent - the `extent` field from getMainGraphBounds (half-diagonal)
 * @return {IStarfieldRadiusRange} the inner/outer shell radii
 */
export const getStarfieldRadiusRange = (graphExtent: number): IStarfieldRadiusRange => {
  const safeExtent = Number.isFinite(graphExtent) && graphExtent > 0 ? graphExtent : 0;
  const minRadius = Math.max(safeExtent * STAR_SHELL_MIN_FACTOR, STAR_SHELL_MIN_RADIUS);
  const maxRadius = minRadius * STAR_SHELL_THICKNESS_RATIO;
  return {minRadius, maxRadius};
};
