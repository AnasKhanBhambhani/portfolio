import { useEffect, useState } from "react";

export default function Loader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setDone(true), reduced ? 0 : 1300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-100 bg-bg flex flex-col items-center justify-center gap-6.5 transition-[opacity,visibility] duration-700 ${
        done ? "opacity-0 invisible" : "opacity-100 visible"
      }`}
      aria-hidden={done}
    >
      <div className="relative w-16 h-16">
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <span className="absolute inset-2.25 rounded-full border-2 border-transparent border-t-accent animate-[spin_1.4s_linear_infinite_reverse]" />
        <span className="absolute inset-4.5 rounded-full border-2 border-transparent border-t-violet animate-[spin_0.8s_linear_infinite]" />
      </div>
      <div className="w-45 h-0.75 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full w-full origin-left grad-btn rounded-full animate-[load_1.3s_ease_forwards]" />
      </div>
      <div className="font-display text-[13px] tracking-[0.3em] text-muted-2 uppercase">Muhammad Anas</div>
    </div>
  );
}
