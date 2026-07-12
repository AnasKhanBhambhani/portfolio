import Reveal from "./Reveal";
import { CAPABILITIES } from "../data/content";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, GLASS_CARD } from "../ui";
import { IconCode, IconServer, IconLayers, IconUsers } from "./icons";

const ICONS = [IconCode, IconServer, IconLayers, IconUsers];

export default function Capabilities() {
  return (
    <section id="capabilities" className={SECTION}>
      <Reveal className={TAG_HEAD}>Capabilities</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        What I bring to a team
      </Reveal>
      <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-10`}>
        Frontend first, with the range to go deeper when a team needs it.
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
        {CAPABILITIES.map((cap, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal
              key={cap.num}
              delay={(i % 4) + 1}
              className={`${GLASS_CARD} p-6 hover:-translate-y-1.5 hover:border-primary/40`}
            >
              <div className="w-11.5 h-11.5 rounded-xl grid place-items-center bg-linear-to-br from-primary/20 to-accent/12 border border-white/10 text-highlight mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-[17px] mb-2.5 font-semibold">{cap.title}</h3>
              <p className="text-sm text-muted leading-[1.7]">{cap.body}</p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
