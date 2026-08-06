import Reveal from "./Reveal";
import ContactIcons from "./ContactIcons";
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
    <section id="hero" className="relative z-10 min-h-screen flex items-center pt-14 lg:pt-28">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center w-full">
        <div className="relative z-10 max-w-160 w-full">
          <Reveal className="inline-flex items-center gap-2.25 py-2 px-4 rounded-full bg-avail/8 border border-avail/30 text-avail-text text-[13px] font-medium mb-6.5">
            <span className={STATUS_DOT} />
            Open to new opportunities
          </Reveal>

          <Reveal as="h1" delay={1} className="text-[clamp(36px,6vw,68px)] leading-[1.02] font-bold tracking-[-0.03em] font-display whitespace-nowrap">
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

        <Reveal
          delay={2}
          className="relative w-full max-w-120 sm:max-w-140 lg:max-w-150 aspect-square mx-auto lg:mx-0 flex items-center justify-center"
        >
          <svg
            className="absolute inset-0 w-full h-full scale-110"
            style={{ filter: "blur(36px)" }}
            viewBox="-100 -100 200 200"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="heroBlobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-violet)" />
              </linearGradient>
            </defs>
            <path
              fill="url(#heroBlobGradient)"
              opacity="0.75"
              d="M54.2,-62.6C68.4,-53.2,76.8,-34.6,79.4,-15.6C82,3.4,78.8,22.8,69.1,38.4C59.4,54,43.2,65.8,25.4,71.5C7.6,77.2,-11.8,76.8,-29.4,70.2C-47,63.6,-62.8,50.8,-71.4,34.4C-80,18,-81.4,-2,-75.6,-19.4C-69.8,-36.8,-56.8,-51.6,-41.4,-60.8C-26,-70,-13,-73.6,3.5,-79C20,-84.4,40,-72,54.2,-62.6Z"
            />
          </svg>
          <img
            src="/anas.webp"
            alt="Muhammad Anas"
            className="relative z-10 w-full h-full object-contain"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </Reveal>
      </div>
    </section>
  );
}
