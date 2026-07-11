import { useEffect, useState } from "react";
import { NAV_ITEMS, NAV_IDS } from "../data/content";
import useActiveSection from "../hooks/useActiveSection";
import useMagnetic from "../hooks/useMagnetic";
import { IconMenu, IconClose } from "./icons";
import { EASE } from "../ui";

const LINKS = NAV_ITEMS.filter((item) => item.href !== "#contact");

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(NAV_IDS);
  const ctaRef = useMagnetic(14);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        className={`fixed top-0 inset-x-0 z-49 h-18 border-b transition-colors duration-300 ${
          scrolled ? "bg-bg/72 backdrop-blur-2xl border-white/10" : "bg-transparent border-transparent"
        }`}
      />
      <nav className="fixed top-0 inset-x-0 z-50 h-18 max-w-295 mx-auto flex items-center justify-between px-5 sm:px-7 lg:px-8">
        <a href="#hero" className="font-display font-bold text-[19px] tracking-[-0.02em] flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-[3px] grad-btn shadow-[0_0_20px_color-mix(in_srgb,var(--color-primary)_50%,transparent)]" />
          Muhammad<span className="text-muted-2 font-normal">.anas</span>
        </a>

        <div className="hidden lg:flex items-center gap-7.5">
          {LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors duration-250 hover:text-white ${
                active === item.href.slice(1) ? "text-white" : "text-muted"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            ref={ctaRef}
            href="#contact"
            data-magnetic=""
            className="py-2.25 px-5 rounded-xl grad-btn text-white font-semibold text-sm"
          >
            Get in touch
          </a>
        </div>

        <button
          className="lg:hidden w-10 h-10 grid place-items-center text-white"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
        </button>
      </nav>

      <div
        className={`lg:hidden fixed inset-x-0 top-18 z-40 bg-bg/96 backdrop-blur-xl border-b border-white/10
          flex flex-col gap-5.5 p-6 transition-transform duration-400 ${EASE}
          ${open ? "translate-y-0" : "translate-y-[-120%]"}`}
      >
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`text-base font-medium ${active === item.href.slice(1) ? "text-accent" : "text-muted"}`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </>
  );
}
