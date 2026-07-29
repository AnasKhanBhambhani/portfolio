import { cn } from "../../lib/utils";

// Pure-CSS frosted card — no JS library. Was previously a wrapper around
// react-glass-ui's <GlassCard>, which rendered a per-instance SVG filter
// (feDisplacementMap distortion + chromatic aberration) for its "liquid
// glass" hover ripple; with 15-20+ of these cards on the page at once, that
// was a real per-frame GPU cost on weaker devices. The `.glass` class (see
// index.css) gives the same frosted-surface look — blur, sheen gradient,
// inset highlight/border, drop shadow, all theme-aware via CSS custom
// properties already tuned for both themes — with zero runtime cost beyond
// a backdrop-filter. The subtle hover lift is a plain CSS transform now
// instead of a per-pointer-move JS tilt.
//
// `contentClassName` applies to the inner content wrapper (e.g. `h-full` to
// stretch content in an equal-height grid). `borderRadius` (px) overrides
// the default 18px corner radius for callers matching a differently-rounded
// ancestor (e.g. FieldNotes' 20px project-card thumbnails).
export default function GlassCard({ className, contentClassName, borderRadius = 18, children }) {
  return (
    <div
      className={cn("glass transition-transform duration-300 ease-out hover:scale-[1.01]", className)}
      style={{ borderRadius }}
    >
      <div className={cn("h-full", contentClassName)}>{children}</div>
    </div>
  );
}
