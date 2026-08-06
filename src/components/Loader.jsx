import { useEffect, useRef, useState } from "react";

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function readAccentRgb() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
  return hexToRgb(value || "#e11d48");
}

// Module scope, so it survives this component unmounting/remounting but resets
// on a real page load. The intro is a first-visit flourish: <Loader/> renders
// inside App's non-Site-Lens branch, so navigating /site-lens -> / tears that
// branch down and mounts a fresh Loader, which replayed the whole 1.9s intro
// every time you came back. Tracking it here makes the intro play once per
// page load instead of once per client-side navigation.
let hasPlayed = false;

export default function Loader() {
  // Start already-dismissed on any mount after the first, so returning from
  // Site Lens shows the portfolio immediately with no intro flash.
  const [done, setDone] = useState(hasPlayed);
  const canvasRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (hasPlayed) {
      setDone(true);
      return undefined;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // hasPlayed flips when the intro actually FINISHES, not when it starts —
    // StrictMode mounts, cleans up, then remounts in dev, and flipping it up
    // front would make that second mount skip the intro and never dismiss.
    const timer = setTimeout(() => {
      hasPlayed = true;
      setDone(true);
    }, reduced ? 0 : 1900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  // Small stars drifting upward and looping back in at the bottom once
  // they exit the top — purely decorative, stops once the loader is dismissed.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rgb = readAccentRgb();
    let raf;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let stars = [];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    // Every star — including the very first batch — starts just below the
    // bottom edge and streams upward, looping straight back to the bottom
    // the instant it exits the top. The loader only shows for ~1.9s, so the
    // stagger has to be small (a full screen-height head start would mean
    // most stars never even reach the visible area in time) and the speed
    // has to be fast enough to read as a clear upward stream, not a drift.
    function makeStar() {
      return {
        x: Math.random() * width,
        y: height + Math.random() * 80,
        r: Math.random() * 2.2 + 1.6,
        speed: Math.random() * 5 + 4,
        alpha: Math.random() * 0.5 + 0.35,
      };
    }

    function step() {
      if (doneRef.current) return;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.y -= s.speed;
        if (s.y < -8) Object.assign(s, makeStar());
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${s.alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }

    resize();
    stars = Array.from({ length: 90 }, () => makeStar());
    step();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-100 bg-bg flex flex-col items-center justify-center gap-5 transition-[opacity,visibility] duration-700 ${
        done ? "opacity-0 invisible" : "opacity-100 visible"
      }`}
      aria-hidden={done}
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />

      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="font-display text-[clamp(28px,6vw,52px)] font-bold tracking-tight">
          <span className="text-fg">Muhammad </span>
          <span className="text-accent">Anas</span>
        </div>

        <div className="flex items-center gap-3 text-muted-2 text-[11px] tracking-[0.35em] uppercase">
          <span className="w-8 h-px bg-edge/25" />
          Personal Portfolio
          <span className="w-8 h-px bg-edge/25" />
        </div>

        <div className="w-45 sm:w-60 h-px bg-edge/10 mt-1 overflow-hidden">
          <div className="h-full bg-accent origin-left animate-[load_1.9s_ease_forwards]" />
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] tracking-[0.25em] uppercase mt-1">
          <span className="text-accent font-semibold">Build.</span>
          <span className="text-muted-2">Ship.</span>
          <span className="text-muted-2">Iterate.</span>
          <span className="text-muted-2">Repeat.</span>
        </div>
      </div>
    </div>
  );
}
