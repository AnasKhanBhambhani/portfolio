import { NAV_ITEMS, NAV_IDS } from "../data/content";
import useActiveSection from "../hooks/useActiveSection";
import { useTheme } from "../context/ThemeContext";
import {
  IconHome, IconUsers, IconCode, IconLayers, IconClock, IconInfo, IconMail, IconSun, IconMoon,
} from "./icons";
import { EASE } from "../ui";

// Home isn't in NAV_ITEMS (the old top bar used the wordmark for it), but a bottom
// tab bar reads wrong without it — so it's prepended here rather than pushed into
// content.js, which stays free of component concerns.
const HOME_ITEM = { href: "#hero", label: "Home" };
const ITEMS = [HOME_ITEM, ...NAV_ITEMS];

// Icons live here, keyed by href, for the same reason: content.js holds copy, not JSX.
const ICONS = {
  "#hero": IconHome,
  "#about": IconUsers,
  "#capabilities": IconCode,
  "#stack": IconLayers,
  "#timeline": IconClock,
  "#fieldnotes": IconInfo,
  "#contact": IconMail,
};

const SECTION_IDS = [HOME_ITEM.href.slice(1), ...NAV_IDS];

export default function Nav() {
  const active = useActiveSection(SECTION_IDS);
  const { theme, toggleTheme } = useTheme();

  return (
    // Thumb-reach at the bottom on phones/tablets; conventional top chrome from lg up,
    // where the cursor lives at the top of the window and there's room for it.
    <nav
      aria-label="Sections"
      className="fixed left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1.5rem)]
        bottom-4 sm:bottom-6 lg:bottom-auto lg:top-5"
    >
      {/* `glass` is the site's shared frosted surface (see index.css) — translucent fill,
          8.9px backdrop blur, hairline border and soft shadow, flipped per theme. It brings
          its own border and shadow, so none are set here; `rounded-full` overrides the
          class's default 16px radius. */}
      <div className="glass flex items-center gap-0.5 sm:gap-1 rounded-full p-1.5">
        {ITEMS.map((item) => {
          const Icon = ICONS[item.href];
          const isActive = active === item.href.slice(1);
          return (
            <a
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "true" : undefined}
              title={item.label}
              className={`group relative grid place-items-center rounded-full transition-all duration-300 ${EASE}
                ${isActive
                  ? "bg-surface/12 text-fg h-11 gap-2 pl-1.5 pr-1.5 sm:pr-4 grid-flow-col"
                  : "h-11 w-11 text-muted-2 hover:text-fg hover:bg-surface/8"}`}
            >
              <span
                className={`grid place-items-center rounded-full transition-colors duration-300
                  ${isActive ? "h-8 w-8 bg-surface/14" : ""}`}
              >
                <Icon className="w-4.5 h-4.5" />
              </span>
              {/* The label only rides along on the active tab, exactly like the reference —
                  every other tab stays a bare icon so the bar keeps its compact pill shape. */}
              {isActive && (
                <span className="hidden sm:block pr-1 text-sm font-semibold whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </a>
          );
        })}

        <span aria-hidden className="mx-0.5 h-6 w-px shrink-0 bg-edge/12" />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="grid h-11 w-11 place-items-center rounded-full text-muted-2 transition-colors duration-300 hover:bg-surface/8 hover:text-fg"
        >
          {theme === "dark" ? <IconSun className="w-4.5 h-4.5" /> : <IconMoon className="w-4.5 h-4.5" />}
        </button>
      </div>
    </nav>
  );
}
