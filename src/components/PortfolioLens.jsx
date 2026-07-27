import Reveal from "./Reveal";
import { IconArrowRight } from "./icons";
import { useFlipNav } from "../context/FlipNavContext";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, BTN_SOLID } from "../ui";

// Static preview graphic only — no graph library, no data, just a fixed SVG
// scatter of nodes/links echoing the real Site Lens look. Keeps this section
// a lightweight "advertisement": the real interactive visualization only ever
// loads on the dedicated /site-lens page, reached via the whole-page flip.
const NODES = [
  { x: 400, y: 190, r: 16, c: "#27AE60", ring: true },
  { x: 260, y: 110, r: 8, c: "#27AE60" },
  { x: 520, y: 95, r: 7, c: "#27AE60" },
  { x: 610, y: 160, r: 9, c: "#F1AA3E" },
  { x: 150, y: 190, r: 7, c: "#27AE60" },
  { x: 320, y: 260, r: 10, c: "#27AE60" },
  { x: 470, y: 280, r: 8, c: "#27AE60" },
  { x: 590, y: 250, r: 6, c: "#27AE60" },
  { x: 210, y: 290, r: 6, c: "#F1AA3E" },
  { x: 690, y: 100, r: 6, c: "#27AE60" },
  { x: 100, y: 110, r: 5, c: "#27AE60" },
  { x: 380, y: 60, r: 5, c: "#27AE60" },
  { x: 660, y: 300, r: 6, c: "#27AE60" },
  { x: 250, y: 340, r: 5, c: "#27AE60" },
];

const LINKS = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
  [1, 10], [1, 11], [2, 9], [3, 12], [5, 8], [6, 8], [4, 11], [7, 12], [5, 13],
];

export default function PortfolioLens() {
  const flipNavigate = useFlipNav();

  return (
    <section id="portfolio-lens" className={SECTION}>
      <Reveal className={TAG_HEAD}>Interactive Portfolio</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        Tech Visualization Preview
      </Reveal>
      <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-6`}>
        Every project, skill, role and education entry as connected nodes — open the full page to
        explore it as a 3D graph, a 2D graph and a tree.
      </Reveal>

      <Reveal delay={3} className="relative h-[440px] w-full overflow-hidden rounded-2xl border border-edge/10 bg-card">
        <svg viewBox="0 0 800 400" className="absolute inset-0 h-full w-full opacity-70" aria-hidden>
          {LINKS.map(([a, b], i) => (
            <line
              key={i}
              x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
              stroke="var(--color-edge)" strokeOpacity="0.35" strokeWidth="1.5"
            />
          ))}
          {NODES.map((n, i) => (
            <g key={i}>
              {n.ring && (
                <circle cx={n.x} cy={n.y} r={n.r + 10} fill="none" stroke="#e15b6f" strokeWidth="1.5" />
              )}
              <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} />
            </g>
          ))}
        </svg>

        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, var(--color-card), color-mix(in srgb, var(--color-card) 50%, transparent), transparent)" }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-end gap-4 pb-10 text-center px-6">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-2">
            Live 3D graph · 2D graph · tree
          </span>
          <button type="button" onClick={() => flipNavigate("/site-lens")} className={BTN_SOLID}>
            Open Visualization
            <IconArrowRight />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
