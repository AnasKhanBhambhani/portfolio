import { useEffect, useState } from "react";

/**
 * Tracks which section id is currently "active" for scroll-spy nav
 * highlighting. `ids` should be a stable array reference (defined
 * at module scope) so the observer isn't torn down every render.
 */
export default function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] || "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
