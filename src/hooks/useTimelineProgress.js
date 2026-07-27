import { useEffect, useRef } from "react";

const TRACK_INSET = 8; // px — matches the line's top-2/bottom-2 offset

// Tracks how far the viewport's vertical center has travelled through the
// timeline container and writes it as CSS variables (--tl-fill, --tl-dot-top)
// on the container itself, so the progress line/dot can follow scroll with
// plain CSS — no per-scroll React re-render.
export default function useTimelineProgress() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    let rafId = null;

    function update() {
      rafId = null;
      const rect = el.getBoundingClientRect();
      const trackHeight = Math.max(1, el.offsetHeight - TRACK_INSET * 2);
      const viewportMid = window.innerHeight * 0.5;
      const raw = (viewportMid - rect.top - TRACK_INSET) / trackHeight;
      const progress = Math.min(1, Math.max(0, raw));
      const fillPx = progress * trackHeight;
      el.style.setProperty("--tl-fill", `${fillPx}px`);
      el.style.setProperty("--tl-dot-top", `${TRACK_INSET + fillPx}px`);
    }

    function onScroll() {
      if (rafId == null) rafId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  return containerRef;
}
