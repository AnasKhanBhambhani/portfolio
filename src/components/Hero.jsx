import Reveal from "./Reveal";
import ContactIcons from "./ContactIcons";
import { IconArrowRight } from "./icons";
import { BTN_SOLID, BTN_LINE, STATUS_DOT, EASE } from "../ui";
import useMagnetic from "../hooks/useMagnetic";
import useTypewriter from "../hooks/useTypewriter";

const ROLES = [
  "Frontend-Focused Full-Stack Developer",
  "React & Next.js Developer",
  "TypeScript & UI Engineer",
  "Product-Minded Engineer",
];

const CHIP_CLASS =
  "absolute px-3.5 py-2 rounded-xl text-[13px] font-semibold glass border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] whitespace-nowrap";

export default function Hero() {
  const typed = useTypewriter(ROLES);
  const primaryCta = useMagnetic(12);
  const secondaryCta = useMagnetic(12);

  return (
    <section id="hero" className="relative z-10 min-h-screen flex items-center pt-24">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center w-full">
        <div>
          <Reveal className="inline-flex items-center gap-2.25 py-2 px-4 rounded-full bg-avail/8 border border-avail/30 text-avail-text text-[13px] font-medium mb-6.5">
            <span className={STATUS_DOT} />
            Open to new opportunities
          </Reveal>

          <Reveal as="h1" delay={1} className="text-[clamp(44px,8vw,88px)] leading-[1.02] font-bold tracking-[-0.03em] font-display">
            Muhammad <span className="grad-text">Anas</span>
          </Reveal>

          <Reveal
            as="div"
            delay={2}
            className="font-display text-[clamp(20px,3vw,30px)] text-muted mt-2.5 min-h-[1.4em] leading-[1.3]"
          >
            I&apos;m a <span className="text-accent">{typed}</span>
            <span className="inline-block w-0.5 h-[1em] bg-accent ml-0.75 align-[-3px] animate-blink" />
          </Reveal>

          <Reveal as="p" delay={3} className="text-muted text-[17px] max-w-120 mt-6.5 mb-8">
            I build the frontend of full-stack products React, Next.js and TypeScript, with
            the backend fundamentals (Node, Express, databases) to work end to end and I am
            looking for a full-time team to bring that to.
          </Reveal>

          <Reveal delay={4} className="flex gap-3.5 flex-wrap mb-8.5">
            <a ref={primaryCta} href="#fieldnotes" data-magnetic="" className={BTN_SOLID}>
              Read the field notes
              <IconArrowRight />
            </a>
            <a ref={secondaryCta} href="#contact" data-magnetic="" className={BTN_LINE}>
              Get in touch
            </a>
          </Reveal>

          <Reveal delay={4}>
            <ContactIcons />
          </Reveal>
        </div>

        <Reveal
          delay={2}
          className="order-first lg:order-last relative grid place-items-center w-70 h-70 sm:w-85 sm:h-85 lg:w-105 lg:h-105 mx-auto"
        >
          <div
            className={`absolute w-56 h-56 sm:w-67.5 sm:h-67.5 lg:w-85 lg:h-85 rounded-full border border-dashed border-white/15 animate-[spin_22s_linear_infinite]`}
          />
          <div
            className={`absolute w-68 h-68 sm:w-82.5 sm:h-82.5 lg:w-105 lg:h-105 rounded-full border border-dashed border-white/10 animate-[spin_30s_linear_infinite_reverse]`}
          />

          <div className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-primary/30 to-accent/15 border border-white/10 top-[12%] right-[8%] animate-float" />
          <div
            className="absolute w-5 h-5 sm:w-6.5 sm:h-6.5 rounded-full bg-linear-to-br from-primary/30 to-accent/15 border border-white/10 bottom-[18%] right-[22%] animate-float"
            style={{ animationDelay: "-2.5s" }}
          />

          <div
            className={`relative w-38 h-38 sm:w-47.5 sm:h-47.5 lg:w-60 lg:h-60 rounded-4xl grid place-items-center
              bg-linear-to-br from-primary/25 to-violet/18 border border-white/12 backdrop-blur-md
              shadow-[0_30px_80px_color-mix(in_srgb,var(--color-primary)_25%,transparent)] animate-float ${EASE}`}
          >
            <span className="font-display font-bold text-[40px] sm:text-[56px] lg:text-[72px] grad-text">MA</span>
          </div>

          <span className={`${CHIP_CLASS} top-[6%] left-0 sm:left-[-6%] text-highlight`}>React</span>
          <span className={`${CHIP_CLASS} top-[42%] right-0 sm:right-[-14%] text-violet`}>Next.js</span>
          <span className={`${CHIP_CLASS} bottom-[4%] left-[8%] sm:left-[6%] text-accent`}>TypeScript</span>
        </Reveal>
      </div>

      <div className="hidden lg:flex absolute bottom-7.5 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-muted-2 text-xs tracking-[0.2em] uppercase">
        <div className="w-6 h-9.5 border-2 border-muted-2 rounded-[14px] flex justify-center pt-1.5">
          <span className="w-1 h-2 bg-accent rounded-[3px] animate-scrolldot" />
        </div>
        Scroll
      </div>
    </section>
  );
}
