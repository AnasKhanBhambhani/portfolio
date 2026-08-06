import { useEffect, useState } from "react";

const OBSERVER_OPTIONS = { rootMargin: "-40% 0px -50% 0px", threshold: 0 };

/**
 * Tracks which section id is currently "active" for scroll-spy nav
 * highlighting. `ids` should be a stable array reference (defined
 * at module scope) so the observer isn't torn down every render.
 *
 * Everything below the hero renders inside a lazily-imported chunk, so on first
 * mount most of these sections are not in the DOM yet. Observing only what exists
 * at that moment would permanently lock the nav to the hero — so when sections are
 * missing we watch for them and re-attach as they arrive.
 */
export default function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] || "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;

    let observer = null;
    let observedCount = 0;

    const attach = () => {
      const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
      // Nothing new showed up — leave the current observer alone rather than
      // churning through a disconnect/reconnect on every unrelated DOM mutation.
      if (elements.length === observedCount) return elements.length === ids.length;

      observer?.disconnect();
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, OBSERVER_OPTIONS);
      elements.forEach((el) => observer.observe(el));
      observedCount = elements.length;
      return elements.length === ids.length;
    };

    if (attach()) {
      return () => observer?.disconnect();
    }

    const mutations = new MutationObserver(() => {
      if (attach()) mutations.disconnect();
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer?.disconnect();
    };
  }, [ids]);

  return active;
}
