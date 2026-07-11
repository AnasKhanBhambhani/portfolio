import Reveal from "./Reveal";
import { TIMELINE } from "../data/content";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, CHIP } from "../ui";

export default function Timeline() {
  return (
    <section id="timeline" className={SECTION}>
      <Reveal className={TAG_HEAD}>Career</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        Experience
      </Reveal>
      <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-11`}>
        Five-plus years of shipping features people actually use, across contract and freelance
        engagements.
      </Reveal>

      <div className="relative">
        <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-linear-to-b from-primary via-violet to-transparent" />
        <div className="flex flex-col gap-11">
          {TIMELINE.map((entry, i) => (
            <Reveal delay={i + 1} key={`${entry.role}-${entry.date}`} className="relative pl-9">
              <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-bg border-2 border-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]" />

              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                <div className="font-display text-xl font-semibold">
                  {entry.role} · <span className="text-highlight font-medium">{entry.org}</span>
                </div>
                <div className="font-display text-[13px] text-muted-2 whitespace-nowrap">
                  {entry.date.split("\n").join(" ")}
                </div>
              </div>

              <ul className="flex flex-col gap-2 my-2.5 mb-3.5">
                {entry.bullets.map((bullet) => (
                  <li key={bullet} className="text-muted text-[15px] leading-[1.6]">
                    {bullet}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span className={CHIP} key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
