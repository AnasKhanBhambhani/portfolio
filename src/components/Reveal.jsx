/**
 * Generic scroll-reveal wrapper, backed by AOS (initialised once in App.jsx).
 *
 * Renders as `as` (default "div") and animates the first time it enters the
 * viewport. Kept as a component rather than sprinkling `data-aos` attributes by
 * hand so the whole site shares one entrance treatment, and so swapping the
 * animation engine again later is a one-file change.
 *
 * - `delay` (0-4) staggers siblings, matching the old API. AOS ships delay CSS in
 *   50ms steps only, so the index is multiplied by 100 — an arbitrary value like
 *   80ms would match no rule and silently apply no delay at all.
 * - `animation` takes any AOS name ("fade-up", "zoom-in", "flip-left", …).
 */
const MAX_AOS_DELAY = 3000;

export default function Reveal({
  as: Tag = "div",
  delay = 0,
  animation = "fade-up",
  className = "",
  style,
  children,
  ...rest
}) {
  const delayMs = Math.min(Math.round(delay) * 100, MAX_AOS_DELAY);

  return (
    <Tag
      data-aos={animation}
      data-aos-delay={delayMs || undefined}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
