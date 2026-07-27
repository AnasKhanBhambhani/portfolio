import { useEffect, useMemo, useRef, useState } from "react";
import Tree from "react-d3-tree";
import { buildHierarchy, readThemeColors } from "../../data/stackGraphData";

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

function renderNode({ nodeDatum, toggleNode }) {
  const isRoot = nodeDatum.kind === "root";
  const isGroup = nodeDatum.kind === "group";
  const radius = isRoot ? 18 : isGroup ? 14 : 9;
  const hasChildren = Boolean(nodeDatum.children?.length);

  return (
    <g onClick={hasChildren ? toggleNode : undefined} style={{ cursor: hasChildren ? "pointer" : "default" }}>
      <circle r={radius} fill={nodeDatum.color} stroke={isRoot ? "#f8fafc" : "none"} strokeWidth={2} />
      <text
        x={radius + 10}
        dy=".35em"
        fill="#ffffff"
        fontSize={isRoot ? 16 : isGroup ? 13.5 : 12}
        fontWeight={isRoot || isGroup ? 600 : 500}
        letterSpacing="0.01em"
        fontFamily="Geist Sans, system-ui, -apple-system, Segoe UI, sans-serif"
      >
        {nodeDatum.name}
      </text>
    </g>
  );
}

export default function HierarchyTree() {
  const dataRef = useRef(null);
  if (!dataRef.current) dataRef.current = buildHierarchy(readThemeColors().palette);
  const [containerRef, { width, height }] = useContainerSize();

  const translate = useMemo(() => ({ x: 90, y: height / 2 || 0 }), [height]);

  return (
    <div ref={containerRef} className="relative h-full w-full [&_.rd3t-link]:stroke-white/15">
      {width > 0 && height > 0 && (
        <Tree
          data={dataRef.current}
          translate={translate}
          orientation="horizontal"
          pathFunc="step"
          collapsible
          zoom={0.55}
          scaleExtent={{ min: 0.25, max: 1.5 }}
          separation={{ siblings: 1, nonSiblings: 1.25 }}
          nodeSize={{ x: 200, y: 40 }}
          renderCustomNodeElement={renderNode}
        />
      )}
    </div>
  );
}
