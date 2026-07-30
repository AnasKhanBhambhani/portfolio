import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import SpriteText from "three-spritetext";
import { buildForceGraph, readThemeColors } from "../../data/stackGraphData";

function useContainerSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

const NODE_SIZE = { root: 34, group: 18, item: 10 };
// Vertical gap (world units) from a node's center to its label, roughly
// tracking each kind's sphere radius so labels sit just below the node.
const LABEL_OFFSET = { root: 15, group: 12, item: 9 };

// Passed to three's WebGLRenderer. `failIfMajorPerformanceCaveat: false` lets
// a context be created even when the browser would fall back to a slower
// software path (blocklisted GPU, weak hardware) instead of refusing outright.
const RENDERER_CONFIG = {
  antialias: true,
  alpha: true,
  powerPreference: "default",
  failIfMajorPerformanceCaveat: false,
};

// One-time probe: can this browser create a WebGL context at all? If not
// (hardware acceleration disabled, no GL driver), there's nothing three can
// do — we show a clear reason instead of letting the renderer throw.
function detectWebGL() {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("experimental-webgl", { failIfMajorPerformanceCaveat: false });
    return Boolean(gl);
  } catch {
    return false;
  }
}

export default function Graph3D() {
  const data = useMemo(() => buildForceGraph(readThemeColors().palette), []);
  const [containerRef, { width, height }] = useContainerSize();
  const fgRef = useRef(null);
  const [webglOk] = useState(detectWebGL);

  const [canDrag] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !width || !height || !webglOk) return undefined;

    fg.d3Force("charge").strength(-260);
    fg.d3Force("link").distance((link) => {
      const involvesRoot = link.source?.kind === "root" || link.target?.kind === "root";
      return involvesRoot ? 145 : 80;
    });

    // Wait for the physics to actually spread the nodes out first — fitting
    // too early (while nodes are still clustered near the origin) leaves
    // the camera zoomed to a near-empty bounding box.
    const timers = [
      setTimeout(() => fg.zoomToFit(0, 60), 400),
      setTimeout(() => fg.zoomToFit(800, 60), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [width, height, webglOk]);

  if (!webglOk) {
    return (
      <div className="h-full w-full grid place-items-center p-8 text-center">
        <p className="text-muted text-sm max-w-80">
          The 3D view needs WebGL, which is currently unavailable in this browser.
          Enable hardware acceleration (or use the 2D / Hierarchy tabs).
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {width > 0 && height > 0 && (
        <ForceGraph3D
          ref={fgRef}
          graphData={data}
          width={width}
          height={height}
          rendererConfig={RENDERER_CONFIG}
          backgroundColor="rgba(0,0,0,0)"
          showNavInfo={false}
          nodeRelSize={4}
          nodeVal={(node) => NODE_SIZE[node.kind]}
          nodeColor="color"
          nodeOpacity={0.95}
          nodeThreeObjectExtend
          nodeThreeObject={(node) => {
            const isRoot = node.kind === "root";
            const isGroup = node.kind === "group";
            const sprite = new SpriteText(node.name);
            sprite.color = isGroup || isRoot ? "#f8fafc" : "#cbd5e1";
            sprite.textHeight = isRoot ? 7 : isGroup ? 6 : 4.5;
            sprite.fontFace = "Manrope, sans-serif";
            sprite.fontWeight = isRoot || isGroup ? "600" : "400";
            sprite.material.depthWrite = false;
            sprite.position.set(0, -LABEL_OFFSET[node.kind], 0);
            return sprite;
          }}
          linkColor={() => "rgba(255,255,255,0.25)"}
          linkWidth={0.5}
          enableNodeDrag={canDrag}
          cooldownTime={2600}
        />
      )}
    </div>
  );
}
