import { useState } from "react";
import Reveal from "./Reveal";
import GlassCard from "./ui/GlassCard";
import useTimelineProgress from "../hooks/useTimelineProgress";
import { TIMELINE } from "../data/content";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, CHIP } from "../ui";
import { IconUp } from "./icons";

// Cards with more than this many bullets collapse to just this many by
// default (+ a toggle) — on a narrow mobile column, 4-5 long bullets each
// wrap across many lines and make the card feel bloated. Cards at or under
// the threshold render with no toggle at all, unaffected.
const COLLAPSE_THRESHOLD = 3;

function TimelineBullets({ bullets }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = bullets.length > COLLAPSE_THRESHOLD;
  const visible = expanded || !hasMore ? bullets : bullets.slice(0, COLLAPSE_THRESHOLD);

  return (
    <>
      <ul className="flex flex-col gap-2 my-2.5 mb-3.5">
        {visible.map((bullet) => (
          <li key={bullet} className="text-muted text-[15px] leading-[1.6]">
            {bullet}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent mb-3.5 -mt-1"
        >
          {expanded ? "Show less" : `Show ${bullets.length - COLLAPSE_THRESHOLD} more`}
          <IconUp className={`w-3 h-3 transition-transform duration-300 ${expanded ? "" : "rotate-180"}`} />
        </button>
      )}
    </>
  );
}

export default function Timeline() {
  const trackRef = useTimelineProgress();

  return (
    <section id="timeline" className={SECTION}>
      <Reveal className={TAG_HEAD}>Career</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        Experience
      </Reveal>
      <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-11`}>
        Four years of shipping features people actually use, across contract engagements.
      </Reveal>

      <div ref={trackRef} className="relative">
        {/* base line */}
        <div className="absolute left-4 lg:left-1/2 top-2 bottom-2 w-0.5 -translate-x-1/2 bg-edge/10" />
        {/* scroll-filled line */}
        <div
          className="absolute left-4 lg:left-1/2 top-2 w-0.5 -translate-x-1/2 bg-linear-to-b from-primary to-accent"
          style={{ height: "var(--tl-fill, 0px)" }}
        />
        {/* travelling dot */}
        <div
          className="absolute left-4 lg:left-1/2 w-3.5 h-3.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_0_5px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
          style={{ top: "var(--tl-dot-top, 8px)" }}
        />

        <div className="flex flex-col gap-12 lg:gap-16">
          {TIMELINE.map((entry, i) => {
            const isRight = i % 2 === 1;
            return (
              <Reveal
                delay={Math.min(i + 1, 4)}
                key={`${entry.role}-${entry.date}`}
                className={`relative pl-12 lg:pl-0 lg:flex ${isRight ? "lg:justify-end" : "lg:justify-start"}`}
              >
                {/* static per-entry marker on the line, at this card's own position */}
                <span className="absolute left-4 lg:left-1/2 top-1.5 w-3 h-3 -translate-x-1/2 rounded-full bg-bg border-2 border-accent" />

                <GlassCard
                  className={`w-full! lg:w-[calc(50%-2.75rem)]! ${isRight ? "lg:ml-11" : "lg:mr-11"}`}
                >
                  <div className="p-6 sm:p-7">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                      <div className="font-display text-xl font-semibold">
                        {entry.role} · <span className="text-highlight font-medium">{entry.org}</span>
                      </div>
                      <div className="font-display text-[13px] text-muted-2 whitespace-nowrap">
                        {entry.date.split("\n").join(" ")}
                      </div>
                    </div>

                    <TimelineBullets bullets={entry.bullets} />

                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span className={CHIP} key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
