import { useEffect } from "react";
import { NAV_IDS } from "../data/content";

// Section ids that map to a real URL path. "hero" is the landing/home ("/").
const SECTION_IDS = ["hero", ...NAV_IDS];

function idToPath(id) {
  return id === "hero" ? "/" : `/${id}`;
}

function pathToId(pathname) {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "") return "hero";
  const id = clean.slice(1);
  return SECTION_IDS.includes(id) ? id : null;
}

// Turns in-page anchor links into clean path-based navigation:
//   click "About"  -> URL becomes "/about" (no page reload, no #hash)
//   refresh /about -> scrolls to the About section on load
//   back / forward -> scrolls to the matching section
export default function useSectionRouter() {
  useEffect(() => {
    function scrollToId(id, behavior) {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === "hero") {
        window.scrollTo({ top: 0, behavior });
      } else {
        el.scrollIntoView({ behavior, block: "start" });
      }
    }

    // Deep link: if we loaded on /about (etc.), jump to that section.
    const initialId = pathToId(window.location.pathname);
    if (initialId && initialId !== "hero") {
      requestAnimationFrame(() => scrollToId(initialId, "auto"));
    }

    function handleClick(e) {
      // Leave modified clicks (open-in-new-tab etc.) to the browser.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const link = e.target.closest?.("a[href^='#']");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.length < 2) return;

      const id = decodeURIComponent(href.slice(1));
      if (!document.getElementById(id)) return;

      e.preventDefault();

      const path = SECTION_IDS.includes(id) ? idToPath(id) : window.location.pathname;
      if (path !== window.location.pathname) {
        window.history.pushState({ id }, "", path);
      }
      scrollToId(id, "smooth");
    }

    function handlePopState() {
      const id = pathToId(window.location.pathname);
      if (id) scrollToId(id, "smooth");
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}
