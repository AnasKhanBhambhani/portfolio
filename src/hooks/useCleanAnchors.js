import { useEffect } from "react";

// In-page navigation without leaving a "#section" hash in the address bar.
// Intercepts clicks on same-page anchor links, scrolls to the target, and
// strips the hash so the URL stays clean (e.g. "/" instead of "/#contact").
export default function useCleanAnchors() {
  useEffect(() => {
    function handleClick(e) {
      // Ignore modified clicks (open-in-new-tab, etc.) and non-primary buttons.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      const link = e.target.closest?.("a[href^='#']");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.length < 2) return;

      const id = decodeURIComponent(href.slice(1));
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // Drop the hash without adding a history entry or triggering a jump.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);
}
