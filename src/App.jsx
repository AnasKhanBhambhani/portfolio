import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Loader from "./components/Loader";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import { IconSun, IconMoon, IconArrowLeft } from "./components/icons";
import { FlipNavProvider } from "./context/FlipNavContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import useSectionRouter from "./hooks/useSectionRouter";

// Everything below Hero is one lazy chunk — see MainContent.jsx for why.
// Site Lens is its own lazy chunk regardless (2MB+,
// only ever needed if the user actually opens it) and is NOT prefetched
// automatically anymore — see PortfolioLens's hover/focus-triggered prefetch
// instead, which only spends that bandwidth on real intent to click through.
const MainContent = lazy(() => import("./components/MainContent"));
const SiteLens = lazy(() => import("./site-lens/mount"));

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

// Rendered inside <ThemeProvider> (as a descendant in the JSX tree below),
// so it's a separate component rather than inline in App — App itself can't
// call useTheme() since it's the ancestor that renders the provider.
function SiteLensThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted-2 transition-colors hover:bg-surface/10 hover:text-fg [&_svg]:w-4.5 [&_svg]:h-4.5"
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}

// Site Lens's own header renders its 3D/2D/Tree tabs starting flush at the
// top-left, so this bar sits as a normal (non-fixed) row ABOVE it rather than
// floating over it. Its height (h-15 = 60px) matches the `--chrome-height`
// fallback Site Lens's own layout already reserves space for (see
// site-lens/index.tsx's `100vh - var(--chrome-height, 60px)`), so it doesn't
// need to be set explicitly — the two heights just have to line up.
//
// "Back to portfolio" is the only way out of this page, so it's a real button —
// surface fill, border and a drawn arrow icon — rather than a bare text link
// that reads as one more tab beside Site Lens's own.
function SiteLensTopBar({ onBack }) {
  return (
    <div className="h-15 flex items-center gap-1 border-b border-edge/10 bg-bg px-6.5">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to portfolio"
        className="group inline-flex items-center gap-2 rounded-full border border-edge/15 bg-surface/10 px-4 py-2 text-sm font-semibold text-fg transition-colors hover:border-edge/30 hover:bg-surface/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <IconArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Portfolio
      </button>
      <div className="ml-auto">
        <SiteLensThemeToggle />
      </div>
    </div>
  );
}

function App() {
  useSectionRouter();

  const [path, setPath] = useState(() =>
    typeof window !== "undefined" ? normalizePath(window.location.pathname) : "/",
  );

  // Scroll-entrance engine for every <Reveal> on the page. Initialised once, here,
  // rather than per-component: AOS is a singleton that scans the document itself.
  // Its own MutationObserver picks up the lazily-mounted sections, so no manual
  // refresh is needed when MainContent's chunk lands.
  useEffect(() => {
    AOS.init({
      once: true, // reveal on the way down only — no re-animating on the way back up
      duration: 700,
      easing: "ease-out-cubic",
      offset: 80, // fire a little before the element's top reaches the viewport edge
      // Honour the OS "reduce motion" setting: AOS then leaves everything in its
      // final, visible state instead of animating.
      disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, []);

  useEffect(() => {
    function onPopState() {
      setPath(normalizePath(window.location.pathname));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback(
    (nextPath) => {
      const target = normalizePath(nextPath);
      if (target === path) return;
      window.history.pushState({}, "", target);
      setPath(target);
      window.scrollTo(0, 0);
    },
    [path],
  );

  const isSiteLens = path === "/site-lens";

  return (
    <ThemeProvider>
    <FlipNavProvider value={navigate}>
      {isSiteLens ? (
        <>
          <SiteLensTopBar onBack={() => navigate("/")} />
          <Suspense fallback={<div className="min-h-screen bg-bg" />}>
            <SiteLens />
          </Suspense>
        </>
      ) : (
        <>
          <a
            href="#main"
            className="fixed left-3 -top-24 focus:top-3 z-1000 grad-btn text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-[top] duration-200"
          >
            Skip to content
          </a>

          <Loader />
          <Nav />

          <main id="main" className="max-w-295 mx-auto px-5 sm:px-7 lg:px-8 overflow-x-clip">
            <Hero />
          </main>

          <Suspense fallback={null}>
            <MainContent />
          </Suspense>
        </>
      )}
    </FlipNavProvider>
    </ThemeProvider>
  );
}

export default App;
