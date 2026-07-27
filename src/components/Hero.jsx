import Reveal from "./Reveal";
import ContactIcons from "./ContactIcons";
import HeroCode from "./HeroCode";
import { IconArrowRight } from "./icons";
import { BTN_SOLID, BTN_LINE, STATUS_DOT } from "../ui";
import useMagnetic from "../hooks/useMagnetic";
import useTypewriter from "../hooks/useTypewriter";

const ROLES = [
  "Frontend-Focused Full-Stack Developer",
  "React & Next.js Developer",
  "TypeScript & UI Engineer",
  "Product-Minded Engineer",
];

export default function Hero() {
  const typed = useTypewriter(ROLES);
  const primaryCta = useMagnetic(12);
  const secondaryCta = useMagnetic(12);

  return (
    <section id="hero" className="relative z-10 min-h-screen flex items-center pt-24">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center w-full">
        <div className="relative z-10 max-w-160 w-full">
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
            className="font-display text-[clamp(20px,3vw,30px)] text-muted mt-2.5 min-h-[2.6em] leading-[1.3]"
          >
            I&apos;m a <span className="text-accent">{typed}</span>
            <span className="inline-block w-0.5 h-[1em] bg-accent ml-0.75 align-[-3px] animate-blink" />
          </Reveal>

          <Reveal as="p" delay={3} className="text-muted text-[17px] max-w-120 mt-3.5 mb-8">
            I build the frontend of full-stack products React, Next.js and TypeScript, with
            the backend fundamentals (Node, Express, databases) to work end to end and I am
            looking for a full-time team to bring that to.
          </Reveal>

          <Reveal delay={4} className="flex gap-3.5 flex-wrap mt-2.5 mb-8.5">
            <a
              ref={primaryCta}
              href="/resume.pdf"
              download
              data-magnetic=""
              className={`${BTN_SOLID} px-5! py-2.5! text-sm!`}
            >
              Download CV
              <IconArrowRight />
            </a>
            <a
              ref={secondaryCta}
              href="#contact"
              data-magnetic=""
              className={`${BTN_LINE} px-5! py-2.5! text-sm!`}
            >
              Get in touch
            </a>
          </Reveal>

          <Reveal delay={4}>
            <ContactIcons />
          </Reveal>
        </div>

        <Reveal delay={2} className="hidden lg:flex justify-end">
          <HeroCode />
        </Reveal>
      </div>
    </section>
  );
}
