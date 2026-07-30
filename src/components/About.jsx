import { lazy, Suspense } from "react";
import Reveal from "./Reveal";
import GlassCard from "./ui/GlassCard";
import { FACTS } from "../data/content";
import { SECTION, TAG_HEAD, SEC_TITLE } from "../ui";

// Lazy, same as Hero's own usage — dynamic imports of the same module are
// deduped by the loader, so this shares Hero's fetch rather than doubling it.
const HeroCode = lazy(() => import("./HeroCode"));

const PARA = "text-muted text-base leading-[1.7]";

export default function About() {
  return (
    <section id="about" className={SECTION}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-15 mb-10">
        <div>
          <Reveal className={TAG_HEAD}>About Me</Reveal>
          <Reveal as="h2" delay={1} className={`${SEC_TITLE} leading-[1.05]`}>
            Engineering products
            <br />
            with intent.
          </Reveal>

          <Reveal as="p" delay={1} className={`${PARA} mb-4.5`}>
            I am a frontend-focused full-stack developer React, Next.js and TypeScript are
            where I do my best work currently building at Enigmatix, with several years before
            that split across agency and contract engagements shipping products for
            international clients frontend-led, and full-stack when a project needed it. I am
            quietly open to the next full-time role where I can do the same at a larger scale.
          </Reveal>
          <Reveal as="p" delay={2} className={`${PARA} mb-4.5`}>
            Most of my work happens under contract, building and maintaining products I
            do not personally own. That&apos;s why the work below is intentionally light on
            names, logos and live links — what I can speak to in detail is{" "}
            <strong className="text-fg font-semibold">how</strong> the work got done: the
            architecture calls, the trade-offs, the performance wins.
          </Reveal>
          <Reveal as="p" delay={3} className={PARA}>
            Day to day that means React, Next.js and TypeScript on the frontend with state,
            performance and reusable component systems as the constant focus backed by working
            knowledge of Node, Express and NestJS and REST or GraphQL APIs, from contract
            full-stack work and my own projects. Enough to design an API, model data, and plug
            into whatever process and tracker a team already runs on.
          </Reveal>
        </div>

        <Reveal delay={1} className="flex items-center justify-center lg:justify-start">
          <Suspense
            fallback={<div className="w-full max-w-115 h-132.5 rounded-2xl border border-edge/12 bg-card" />}
          >
            <HeroCode />
          </Suspense>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FACTS.map((fact, i) => (
          <Reveal key={fact.k} delay={(i % 4) + 1} className="h-full">
            <GlassCard className="w-full! h-full!" contentClassName="h-full">
              <div className="p-5.5 h-full">
                <div className="font-display text-[15px] text-highlight mb-2 font-semibold">{fact.k}</div>
                <div className="text-muted text-sm">{fact.v}</div>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
