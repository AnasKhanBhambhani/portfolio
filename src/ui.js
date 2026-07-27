// Shared Tailwind utility fragments reused across sections, so the
// same "look" (eyebrows, section titles, chips, buttons, glass cards)
// stays in one place instead of being retyped in every component.

export const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

export const SECTION = "relative z-10 py-16 lg:py-30 scroll-mt-20";

export const TAG_HEAD =
  "inline-flex items-center gap-2.25 font-display text-[13px] tracking-[0.18em] uppercase text-accent mb-4.5 " +
  "before:content-[''] before:w-6.5 before:h-px before:bg-accent";

export const SEC_TITLE = "text-[clamp(30px,4.5vw,48px)] mb-4.5";

// No margin-bottom baked in — callers add their own so it never
// collides with a per-usage override.
export const SEC_LEDE = "text-muted max-w-[560px] text-base leading-[1.6]";

export const CHIP =
  "font-sans text-xs px-3 py-1.25 rounded-full bg-primary/8 border border-primary/20 text-muted " +
  `transition-colors duration-250 ${EASE} hover:border-accent/50 hover:text-fg`;

const BTN_BASE =
  "inline-flex items-center gap-2.25 px-6.5 py-3.5 rounded-[14px] font-semibold text-[15px] cursor-pointer " +
  `transition-[transform,box-shadow,border-color,background-color] duration-300 ${EASE} [&_svg]:w-4 [&_svg]:h-4`;

export const BTN_SOLID =
  `${BTN_BASE} grad-btn text-white shadow-[0_10px_40px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] ` +
  "hover:shadow-[0_14px_50px_color-mix(in_srgb,var(--color-primary)_50%,transparent)] hover:-translate-y-0.5";

export const BTN_LINE =
  `${BTN_BASE} bg-surface/4 border-2 border-edge/30 text-fg backdrop-blur-[10px] ` +
  "hover:border-accent hover:bg-accent/6 hover:-translate-y-0.5";

export const STATUS_DOT = "w-2 h-2 rounded-full bg-avail animate-pulse-dot flex-shrink-0";

export const GLASS_CARD =
  `glass border border-edge/20 rounded-[18px] transition-[transform,border-color] duration-350 ${EASE}`;
