import { GlassCard as BaseGlassCard } from "react-glass-ui";
import { useTheme } from "../../context/ThemeContext";

// Site-wide default look for react-glass-ui's <GlassCard>: a bright frosted
// surface with a soft edge glow and a subtle liquid-glass distortion/tilt on
// hover. Any prop can still be overridden per usage.
//
// Theme note: this library takes real color strings (not CSS vars — its SVG
// filter pipeline needs resolved colors), so it can't just inherit our
// `.glass` CSS variables. In dark mode the card is a white-tinted surface
// (bright on black). In light mode a white fill over an already-white page
// is a no-op — alpha-blending white onto white stays white — so the card
// interior read as invisible with only its border showing. Light mode uses a
// dark, low-opacity fill instead (composites to a visible light-gray
// surface), mirroring the .glass CSS treatment in index.css.
//
// Layout note: GlassCard's root renders `width/height: fit-content` unless
// you pass explicit pixel `width`/`height` props (both are numbers, not
// responsive). We deliberately never pass them — for our text-heavy cards,
// `fit-content` clamps to the available space of whatever wraps this
// component, so put responsive Tailwind width classes (e.g.
// `lg:w-[calc(50%-2.75rem)]`) on `className` and it fills that space exactly
// like a normal `width: 100%` block would.
const THEME_DEFAULTS = {
  dark: {
    borderColor: "#ffffff",
    borderOpacity: 0.28,
    borderSize: 1,
    backgroundColor: "#ffffff",
    backgroundOpacity: 0.1,
    innerLightColor: "#ffffff",
    innerLightOpacity: 0.2,
    outerLightColor: "#ffffff",
    outerLightOpacity: 0.12,
  },
  light: {
    // Bolder + more opaque than dark mode's border needs to be: a hairline at
    // low opacity all but disappears against a bright page, where dark mode's
    // white-on-black equivalent already reads fine at lower contrast.
    borderColor: "#0f0f14",
    borderOpacity: 0.35,
    borderSize: 1.5,
    backgroundColor: "#0f0f14",
    backgroundOpacity: 0.045,
    innerLightColor: "#ffffff",
    innerLightOpacity: 0.7,
    outerLightColor: "#0f0f14",
    outerLightOpacity: 0.08,
  },
};

const SHARED_DEFAULTS = {
  // The library's OWN internal default is `color: "white"`, applied
  // unconditionally as an inline style on the root — invisible text-on-white
  // once light mode flips the card bright. Pin it to the theme's foreground
  // token instead (a CSS var resolves fine as a plain inline style value).
  color: "var(--color-fg)",
  blur: 6,
  distortion: 22,
  chromaticAberration: 0,
  innerLightBlur: 26,
  innerLightSpread: 1,
  outerLightBlur: 26,
  outerLightSpread: 1,
  saturation: 140,
  brightness: 100,
  flexibility: 5,
  onHoverScale: 1.01,
  borderRadius: 18,
  // Zeroed out deliberately: the component applies `padding` via inline
  // style, which always beats a stylesheet class, so a `p-6` on
  // `contentClassName` would silently do nothing. Wrap children in a plain
  // div with real (responsive-capable) Tailwind padding classes instead.
  padding: "0px",
};

export default function GlassCard({ children, ...props }) {
  const { theme } = useTheme();
  return (
    <BaseGlassCard {...SHARED_DEFAULTS} {...THEME_DEFAULTS[theme]} {...props}>
      {children}
    </BaseGlassCard>
  );
}
