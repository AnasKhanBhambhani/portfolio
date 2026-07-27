import { useEffect, useRef, useState } from "react";

// Chain of circles chasing the pointer with increasing lag, merged into one
// continuous blob by an SVG "goo" filter (blur + a sharpened alpha curve).
// At rest every point converges onto the same spot — reads as one simple
// dot. While moving, the lag stretches the chain out behind the pointer, so
// it spreads like a jellyfish trailing its tentacles in the direction of
// travel. `mix-blend-mode: difference` keeps it visible over any background.
const TRAIL_LENGTH = 7;
const REST_RADIUS = 9;
const HOVER_RADIUS = 15;
// Kept just under ~2x the filter's blur stdDeviation so consecutive trail
// circles are always close enough for the goo filter to visually bridge them
// — without this, a fast mouse move spreads the lag chain out far enough
// that the circles render as separate dots instead of one merged blob.
const MAX_GAP = 22;

export default function CustomCursor() {
  const circleRefs = useRef([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  // Gate the global `cursor: none` on this class so the native cursor is only
  // hidden while the custom cursor is mounted. On unmount (e.g. navigating to
  // /site-lens, which doesn't render CustomCursor) the class is removed and the
  // native cursor returns.
  useEffect(() => {
    if (!enabled) return undefined;
    const root = document.documentElement;
    root.classList.add("custom-cursor-active");
    return () => root.classList.remove("custom-cursor-active");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const points = Array.from({ length: TRAIL_LENGTH }, () => ({ x: mouse.x, y: mouse.y }));
    let hovering = false;
    let raf;

    function handleMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function handleOver(e) {
      hovering = Boolean(e.target.closest("a, button, [data-magnetic]"));
    }

    function loop() {
      points[0].x += (mouse.x - points[0].x) * 0.5;
      points[0].y += (mouse.y - points[0].y) * 0.5;
      for (let i = 1; i < points.length; i++) {
        points[i].x += (points[i - 1].x - points[i].x) * 0.42;
        points[i].y += (points[i - 1].y - points[i].y) * 0.42;

        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const dist = Math.hypot(dx, dy);
        if (dist > MAX_GAP) {
          const ratio = MAX_GAP / dist;
          points[i].x = points[i - 1].x + dx * ratio;
          points[i].y = points[i - 1].y + dy * ratio;
        }
      }

      const baseRadius = hovering ? HOVER_RADIUS : REST_RADIUS;
      circleRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = i / (points.length - 1);
        el.setAttribute("cx", points[i].x);
        el.setAttribute("cy", points[i].y);
        el.setAttribute("r", baseRadius * (1 - t * 0.75));
      });

      raf = requestAnimationFrame(loop);
    }

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <svg className="cursor-goo-svg" aria-hidden="true">
      <defs>
        <filter id="cursor-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
      <g className="cursor-goo-group" filter="url(#cursor-goo)">
        {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
          <circle key={i} ref={(el) => (circleRefs.current[i] = el)} r="0" />
        ))}
      </g>
    </svg>
  );
}
