import { lazy, Suspense, useState } from "react";
import Reveal from "./Reveal";
import GraphErrorBoundary from "./stack/GraphErrorBoundary";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, GLASS_CARD } from "../ui";

const Graph2D = lazy(() => import("./stack/Graph2D"));
const Graph3D = lazy(() => import("./stack/Graph3D"));
const HierarchyTree = lazy(() => import("./stack/HierarchyTree"));

const TABS = [
  { id: "2d", label: "2D Graph", Component: Graph2D },
  { id: "3d", label: "3D Graph", Component: Graph3D },
  { id: "tree", label: "Hierarchy Tree", Component: HierarchyTree },
];

export default function StackGraph() {
  const [activeId, setActiveId] = useState("2d");
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];
  const Active = active.Component;

  return (
    <section id="stack" data-aos="zoom-in" className={SECTION}>
      <Reveal className={TAG_HEAD}>Stack</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        What I build with
      </Reveal>
      <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-6`}>
        Grouped by where it sits in a project, not how impressive it sounds.
      </Reveal>

      <Reveal delay={2} className="mb-6">
        <div className="inline-flex items-center gap-1 p-1 rounded-full glass border border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              aria-pressed={activeId === tab.id}
              className={`font-display text-[13px] font-medium px-5 py-2 rounded-full transition-all duration-250 ${
                activeId === tab.id
                  ? "grad-btn text-white shadow-[0_6px_20px_color-mix(in_srgb,var(--color-primary)_35%,transparent)]"
                  : "text-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={3} className={`${GLASS_CARD} overflow-hidden`}>
        <div className="h-140 sm:h-155 lg:h-165 w-full">
          <GraphErrorBoundary resetKey={active.id}>
            <Suspense fallback={<div className="h-full w-full" />}>
              <Active key={active.id} />
            </Suspense>
          </GraphErrorBoundary>
        </div>
      </Reveal>

      <Reveal delay={3} className="mt-6 flex flex-wrap items-center gap-4">
        <a
          href="/site-lens"
          className="grad-btn inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_20px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          Explore Site Lens — 6-view crawl visualizer
          <span aria-hidden>→</span>
        </a>
        <span className="text-muted-2 text-sm">
          A full SEO crawl-graph tool I rebuilt: 2D/3D force graphs, tree, chord & topic views.
        </span>
      </Reveal>
    </section>
  );
}
