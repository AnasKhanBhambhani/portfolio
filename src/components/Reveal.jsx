import useReveal from "../hooks/useReveal";
import { EASE } from "../ui";

/**
 * Generic scroll-reveal wrapper. Renders as `as` (default "div"),
 * fades/slides in the first time it enters the viewport. `delay`
 * (0-4) staggers siblings via an inline transition-delay.
 */
export default function Reveal({ as: Tag = "div", delay = 0, className = "", style, children, ...rest }) {
  const [ref, inView] = useReveal();
  const mergedStyle = delay ? { transitionDelay: `${delay * 80}ms`, ...style } : style;
  const state = inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[22px]";
  const classes = `transition-all duration-700 ${EASE} ${state} ${className}`.trim();

  return (
    <Tag ref={ref} className={classes} style={mergedStyle} {...rest}>
      {children}
    </Tag>
  );
}
