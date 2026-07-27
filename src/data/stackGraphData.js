import { STACK_GROUPS } from "./content";

export const ROOT_ID = "root";
export const ROOT_COLOR = "#f8fafc";

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hexA, hexB, t) {
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Reads the fixed theme tokens from index.css and derives 6 distinct
// swatches from the 4 accent colors so every group cluster reads as its
// own color family.
export function readThemeColors() {
  const fallback = { primary: "#9f1239", accent: "#e11d48", violet: "#9a3412", highlight: "#fb7185" };
  if (typeof window === "undefined") {
    return {
      palette: [fallback.primary, fallback.accent, fallback.violet, fallback.highlight, fallback.primary, fallback.violet],
      ring: "rgba(225, 29, 72, 0.6)",
    };
  }
  const styles = getComputedStyle(document.documentElement);
  const read = (name) => styles.getPropertyValue(name).trim() || fallback[name.replace("--color-", "")];
  const primary = read("--color-primary");
  const accent = read("--color-accent");
  const violet = read("--color-violet");
  const highlight = read("--color-highlight");
  const [ar, ag, ab] = hexToRgb(accent);
  return {
    palette: [primary, accent, violet, highlight, mix(primary, accent, 0.5), mix(violet, highlight, 0.5)],
    ring: `rgba(${ar}, ${ag}, ${ab}, 0.6)`,
  };
}

// Random per-node phase so they don't all bob in unison once floating kicks in.
export function seed() {
  return Math.random() * Math.PI * 2;
}

// Flat nodes/links shape consumed by both the 2D and 3D force graphs.
export function buildForceGraph(palette) {
  const nodes = [{ id: ROOT_ID, name: "Stack", color: ROOT_COLOR, kind: "root", __seed: seed() }];
  const links = [];

  STACK_GROUPS.forEach((group, i) => {
    const color = palette[i % palette.length];
    const groupId = `group:${group.label}`;
    nodes.push({ id: groupId, name: group.label, color, groupIndex: i, kind: "group", __seed: seed() });
    links.push({ source: ROOT_ID, target: groupId });

    group.items.forEach((item) => {
      const itemId = `item:${group.label}:${item}`;
      nodes.push({ id: itemId, name: item, color, groupIndex: i, kind: "item", __seed: seed() });
      links.push({ source: groupId, target: itemId });
    });
  });

  return { nodes, links };
}

// Nested { name, children } shape consumed by react-d3-tree.
export function buildHierarchy(palette) {
  return {
    name: "Stack",
    color: ROOT_COLOR,
    kind: "root",
    children: STACK_GROUPS.map((group, i) => ({
      name: group.label,
      color: palette[i % palette.length],
      kind: "group",
      children: group.items.map((item) => ({
        name: item,
        color: palette[i % palette.length],
        kind: "item",
      })),
    })),
  };
}
