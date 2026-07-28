import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Loader from "./components/Loader";
import CustomCursor from "./components/CustomCursor";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import { Tabs, TabsContents, TabsContent } from "./components/ui/animate-tabs";
import { IconSun, IconMoon } from "./components/icons";
import { FlipNavProvider } from "./context/FlipNavContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import useSectionRouter from "./hooks/useSectionRouter";

// Everything below About is one lazy chunk — see MainContent.jsx for why
// About itself stays eager. Site Lens is its own lazy chunk regardless (2MB+,
// only ever needed if the user actually opens it) and is NOT prefetched
// automatically anymore — see PortfolioLens's hover/focus-triggered prefetch
// instead, which only spends that bandwidth on real intent to click through.
const MainContent = lazy(() => import("./components/MainContent"));
const SiteLens = lazy(() => import("./site-lens/mount"));

// Visible, clip-path-driven page reveal (see animate-tabs.jsx) — slower and
// more deliberate than the primitive's small-tab-switch default so a full
// page swap actually reads as an animation.
const PAGE_TRANSITION = { type: "tween", duration: 0.6, ease: [0.16, 1, 0.3, 1] };

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
// floating over it. Styled to match those tabs (same text-sm/font-semibold/
// px-[15px] treatment) so "Portfolio" reads as one more tab, not a separate
// floating pill. Its height (h-15 = 60px) matches the `--chrome-height`
// fallback Site Lens's own layout already reserves space for (see
// site-lens/index.tsx's `100vh - var(--chrome-height, 60px)`), so it doesn't
// need to be set explicitly — the two heights just have to line up.
function SiteLensTopBar({ onBack }) {
  return (
    <div className="h-15 flex items-center gap-1 border-b border-edge/10 bg-bg px-6.5">
      <button
        type="button"
        onClick={onBack}
        className="-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-3.75 py-2.75 text-sm font-semibold text-muted-2 transition-colors hover:text-fg"
      >
        <span aria-hidden>←</span> Portfolio
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

  const activeTab = path === "/site-lens" ? "site-lens" : "main";

  return (
    <ThemeProvider>
    <FlipNavProvider value={navigate}>
      <Tabs value={activeTab} onValueChange={(tab) => navigate(tab === "site-lens" ? "/site-lens" : "/")}>
        <TabsContents transition={PAGE_TRANSITION}>
          <TabsContent value="main">
            <a
              href="#main"
              className="fixed left-3 -top-24 focus:top-3 z-1000 grad-btn text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-[top] duration-200"
            >
              Skip to content
            </a>

            <Loader />
            <CustomCursor />
            <Nav />

            <main id="main" className="max-w-295 mx-auto px-5 sm:px-7 lg:px-8 overflow-x-clip">
              <Hero />
              <About />
            </main>

            <Suspense fallback={null}>
              <MainContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="site-lens">
            <SiteLensTopBar onBack={() => navigate("/")} />
            <Suspense fallback={<div className="min-h-screen bg-bg" />}>
              <SiteLens />
            </Suspense>
          </TabsContent>
        </TabsContents>
      </Tabs>
    </FlipNavProvider>
    </ThemeProvider>
  );
}

export default App;
