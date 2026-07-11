// Accent-color presets for the live theme picker. Only the brand
// accent tokens vary — bg/card grounds stay constant across themes
// so every option stays legible against the same dark backdrop.
export const THEMES = [
  {
    id: "maroon",
    label: "Maroon",
    tokens: {
      "--color-primary": "#9f1239",
      "--color-accent": "#e11d48",
      "--color-violet": "#9a3412",
      "--color-highlight": "#fb7185",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    tokens: {
      "--color-primary": "#1d4ed8",
      "--color-accent": "#06b6d4",
      "--color-violet": "#7c3aed",
      "--color-highlight": "#38bdf8",
    },
  },
  {
    id: "emerald",
    label: "Emerald",
    tokens: {
      "--color-primary": "#047857",
      "--color-accent": "#10b981",
      "--color-violet": "#065f46",
      "--color-highlight": "#34d399",
    },
  },
  {
    id: "violet",
    label: "Violet",
    tokens: {
      "--color-primary": "#6d28d9",
      "--color-accent": "#a855f7",
      "--color-violet": "#4c1d95",
      "--color-highlight": "#c084fc",
    },
  },
  {
    id: "amber",
    label: "Amber",
    tokens: {
      "--color-primary": "#b45309",
      "--color-accent": "#f59e0b",
      "--color-violet": "#92400e",
      "--color-highlight": "#fbbf24",
    },
  },
  {
    id: "slate",
    label: "Slate",
    tokens: {
      "--color-primary": "#475569",
      "--color-accent": "#64748b",
      "--color-violet": "#334155",
      "--color-highlight": "#94a3b8",
    },
  },
];

export const DEFAULT_THEME_ID = "maroon";
export const THEME_STORAGE_KEY = "portfolio:theme";
export const THEME_CHANGE_EVENT = "portfolio:themechange";

export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.tokens).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme.id }));
  return theme.id;
}
