import { useEffect, useRef, useState } from "react";
import { IconPalette, IconClose } from "./icons";
import { THEMES, DEFAULT_THEME_ID, THEME_STORAGE_KEY, applyTheme } from "../data/themes";
import { EASE } from "../ui";

export default function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(DEFAULT_THEME_ID);
  const rootRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) {
      applyTheme(saved);
      setActive(saved);
    }
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (open && rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function pick(id) {
    applyTheme(id);
    localStorage.setItem(THEME_STORAGE_KEY, id);
    setActive(id);
  }

  return (
    <div ref={rootRef} className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-90">
      <div
        className={`absolute bottom-16 right-0 glass border border-white/12 rounded-2xl p-4 w-55
          shadow-[0_20px_50px_rgba(0,0,0,0.5)] origin-bottom-right transition-all duration-250 ${EASE}
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="font-display text-xs uppercase tracking-widest text-muted-2 mb-3.5">Preview a theme</div>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => pick(theme.id)}
              aria-label={theme.label}
              aria-pressed={active === theme.id}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                className={`w-9 h-9 rounded-full border-2 transition-all duration-200 ${
                  active === theme.id ? "border-white scale-110" : "border-white/15 group-hover:border-white/40"
                }`}
                style={{
                  background: `linear-gradient(135deg, ${theme.tokens["--color-primary"]}, ${theme.tokens["--color-accent"]})`,
                }}
              />
              <span className="text-[11px] text-muted-2 group-hover:text-white transition-colors duration-200">
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose color theme"
        aria-expanded={open}
        className={`w-13 h-13 grid place-items-center rounded-full grad-btn text-white
          shadow-[0_10px_30px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]
          hover:-translate-y-0.75 transition-transform duration-250 ${EASE} [&_svg]:w-5.5 [&_svg]:h-5.5`}
      >
        {open ? <IconClose /> : <IconPalette />}
      </button>
    </div>
  );
}
