import Reveal from "./Reveal";
import { STACK_GROUPS } from "../data/content";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, CHIP, GLASS_CARD } from "../ui";

export default function Stack() {
  return (
    <section id="stack" className={SECTION}>
      <Reveal className={TAG_HEAD}>Stack</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        What I build with
      </Reveal>
      <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-10`}>
        Grouped by where it sits in a project, not how impressive it sounds.
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {STACK_GROUPS.map((group, i) => (
          <Reveal
            key={group.label}
            delay={(i % 4) + 1}
            className={`${GLASS_CARD} p-6 hover:-translate-y-1.5 hover:border-accent/40`}
          >
            <div className="font-display text-[13px] tracking-widest uppercase text-highlight mb-4">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span className={CHIP} key={item}>
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
