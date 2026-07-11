import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let targetX = ringX;
    let targetY = ringY;
    let raf;

    function handleMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = `${targetX}px`;
        dotRef.current.style.top = `${targetY}px`;
      }
    }
    function handleOver(e) {
      const hoverable = e.target.closest("a, button, [data-magnetic]");
      if (ringRef.current) ringRef.current.classList.toggle("hovering", Boolean(hoverable));
    }
    function loop() {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.left = `${ringX}px`;
        ringRef.current.style.top = `${ringY}px`;
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

  return (
    <>
      <div ref={dotRef} className="cursor-dot w-1.75 h-1.75 bg-highlight" />
      <div ref={ringRef} className="cursor-ring w-9.5 h-9.5 border-[1.5px] border-highlight/60" />
    </>
  );
}
