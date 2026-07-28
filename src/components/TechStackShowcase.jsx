import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { TECH_ICON_ROWS } from "../data/techIcons";

// Full-width tech-stack showcase (video background + monochrome-to-color icon
// grid). Rendered as a plain sibling of <main> — not wrapped in main's
// max-width/overflow-clip container — so it spans edge-to-edge.
export default function TechStackShowcase() {
  const containerRef = useRef(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // The video (~650KB) only starts downloading once this section is close to
  // the viewport, instead of the moment the component mounts — on a slow
  // connection there's no reason to spend that bandwidth before the user has
  // scrolled anywhere near it.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShouldLoadVideo(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Reveal className="relative w-full overflow-hidden py-16">
      <div ref={containerRef} className="absolute inset-0">
        {shouldLoadVideo && (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/video.webm"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="absolute inset-0" style={{ background: "var(--showcase-scrim)" }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--showcase-scrim-edge), transparent, var(--showcase-scrim-edge))",
        }}
      />

      <div className="relative flex flex-col items-center gap-3 px-5">
        {TECH_ICON_ROWS.map((row, i) => (
          <div key={i} className="flex flex-wrap justify-center gap-3">
            {row.map(({ name, Icon, color }) => (
              <div
                key={name}
                tabIndex={0}
                style={{ "--tile-color": color }}
                className="tech-tile group flex w-24 sm:w-28 flex-col items-center justify-center gap-2.5 rounded-xl border border-edge/10 bg-surface/5 px-2 py-4.5 text-center backdrop-blur-sm transition-colors duration-300 hover:border-edge/25 hover:bg-surface/10 focus-visible:border-edge/25 focus-visible:bg-surface/10 focus-visible:outline-none"
              >
                <Icon className="tech-tile-icon h-7 w-7" />
                <span className="text-[11px] text-muted-2 transition-colors duration-300 group-hover:text-fg">
                  {name}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Reveal>
  );
}
