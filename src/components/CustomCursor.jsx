import { useEffect, useRef, useState } from "react";

// Simple custom cursor: one dot that smoothly eases toward the pointer and
// grows slightly over interactive elements. `mix-blend-mode: difference`
// keeps it visible over any background without needing per-frame color logic.
const REST_SIZE = 18;
const HOVER_SIZE = 32;
const EASE = 0.35;

export default function CustomCursor() {
  const dotRef = useRef(null);
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

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let hovering = false;
    let raf;

    function handleMove(e) {
      target.x = e.clientX;
      target.y = e.clientY;
    }
    function handleOver(e) {
      hovering = Boolean(e.target.closest("a, button, [data-magnetic]"));
    }

    function loop() {
      pos.x += (target.x - pos.x) * EASE;
      pos.y += (target.y - pos.y) * EASE;

      const el = dotRef.current;
      if (el) {
        const size = hovering ? HOVER_SIZE : REST_SIZE;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.transform = `translate3d(${pos.x - size / 2}px, ${pos.y - size / 2}px, 0)`;
      }

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

  return <div ref={dotRef} className="cursor-dot" aria-hidden="true" />;
}
