import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { buildForceGraph, readThemeColors } from "../../data/stackGraphData";

// Sizes the canvas to its wrapper instead of a hardcoded number so it
// stays responsive across breakpoints without a page reload.
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

export default function Graph2D() {
  const theme = useMemo(readThemeColors, []);
  const data = useMemo(() => buildForceGraph(theme.palette), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [containerRef, { width, height }] = useContainerSize();
  const fgRef = useRef(null);

  // Node dragging is only wired up for mice/trackpads — on touch it would
  // fight the page's own scroll gesture, same class of bug as the About photo.
  const [canDrag] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !width || !height) return undefined;

    fg.d3Force("charge").strength(-260);
    fg.d3Force("link").distance((link) => {
      const involvesRoot = link.source?.kind === "root" || link.target?.kind === "root";
      return involvesRoot ? 125 : 72;
    });

    // Re-fit whenever the container is resized (mobile address-bar
    // show/hide, orientation change, etc.) — otherwise the view keeps its
    // old zoom/pan against the new canvas size and the graph looks
    // squeezed into a corner instead of staying centered.
    const timer = setTimeout(() => fg.zoomToFit(400, 50), 60);
    return () => clearTimeout(timer);
  }, [width, height]);

  // Once the layout settles, d3-force stops touching node.x/y entirely —
  // that's why it reads as a static image instead of a "floating" graph.
  // Snapshot the settled position per node and nudge it with a slow,
  // per-node-phased sine wave every frame so it drifts gently in place
  // without the actual force simulation ever restarting (which would risk
  // nodes drifting apart / re-clumping instead of just bobbing).
  const floatingRef = useRef(false);
  const hasFittedOnceRef = useRef(false);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {width > 0 && height > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={5}
          nodeLabel="name"
          nodeColor="color"
          linkColor={() => "rgba(255,255,255,0.14)"}
          linkWidth={1}
          cooldownTime={2600}
          autoPauseRedraw={false}
          enableZoomInteraction={false}
          enablePanInteraction={false}
          enableNodeDrag={canDrag}
          onEngineStop={() => {
            // Only auto-fit the very first time the layout settles — doing
            // this after every drag-triggered re-settle would yank the
            // view/zoom out from under the user mid-interaction.
            if (!hasFittedOnceRef.current) {
              fgRef.current?.zoomToFit(400, 50);
              hasFittedOnceRef.current = true;
            }
            data.nodes.forEach((node) => {
              node.__restX = node.x;
              node.__restY = node.y;
            });
            floatingRef.current = true;
          }}
          onNodeDrag={(node) => {
            node.__dragging = true;
            // Pause the floating override entirely while dragging: the
            // library reheats the whole simulation during a drag so linked
            // neighbors can settle around the new position, and our
            // per-frame override would otherwise fight that physics and
            // freeze everything exactly where it was released.
            floatingRef.current = false;
          }}
          onNodeDragEnd={(node) => {
            node.__dragging = false;
            // Don't resume floating here — the engine keeps ticking briefly
            // after release to let the network re-settle around the dropped
            // node; the next onEngineStop re-snapshots rest positions for
            // everyone and turns floating back on.
          }}
          onRenderFramePre={() => {
            if (!floatingRef.current) return;
            const t = performance.now();
            data.nodes.forEach((node) => {
              if (node.__dragging || node.__restX == null) return;
              const amplitude = node.kind === "item" ? 7 : 11;
              node.x = node.__restX + Math.sin(t * 0.0016 + node.__seed) * amplitude;
              node.y = node.__restY + Math.cos(t * 0.0013 + node.__seed) * amplitude;
            });
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const isRoot = node.kind === "root";
            const isGroup = node.kind === "group";
            const radius = isRoot ? 18 : isGroup ? 14 : 8;

            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            if (isRoot) {
              ctx.lineWidth = 2 / globalScale;
              ctx.strokeStyle = theme.ring;
              ctx.stroke();
            }

            const fontSize = (isRoot ? 16 : isGroup ? 14 : 12) / globalScale;
            ctx.font = `${isRoot || isGroup ? "600" : "400"} ${fontSize}px "Geist Sans", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = isGroup || isRoot ? "#f8fafc" : "#cbd5e1";
            ctx.fillText(node.name, node.x, node.y + radius + 3);
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const radius = (node.kind === "root" ? 18 : node.kind === "group" ? 14 : 8) + 3;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
        />
      )}
    </div>
  );
}
