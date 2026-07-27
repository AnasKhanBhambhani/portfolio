import classNames from 'classnames';

/**
 * Site Lens header/tab/toggle Tailwind class constants.
 *
 * Values pixel-matched to the Search Atlas "Site Lens" design-system artifact
 * (both Dark and Light themes). Palette reference:
 *   Dark  — surface #14151D · border #24262F · neutral #1A1B24 · zoom #15161D
 *           text #F3F3F7 / secondary #A7A9B4 / tertiary #6B6D7A
 *   Light — surface #FFFFFF · border #E6E6EA · neutral #F7F7FB
 *           text #141414 / secondary #4E5156 / tertiary #9E9DA1
 *   Brand — var(--color-brand-primary) = #936BDA · glow rgba(147,107,218,0.35)
 */

// Wraps the whole header component (title/status/buttons row + tabs row) in one full-bleed
// container with top/bottom borders only (no side borders) — see getHeaderMainContainerClass.
export const getHeaderMainContainerClass = (isDark: boolean) => classNames(
  '-mx-[26px] -mt-10 px-[26px] pt-[20px] pb-0 border-t border-b border-x-0 border-solid',
  isDark ? 'border-[#24262F]' : 'border-[#E6E6EA]',
);

export const HEADER_ROW_CLASS = 'items-center flex justify-between mb-[14px]';

// Shared base for the per-visualization-type diagram containers in index.tsx — fills the
// remaining viewport height below the header (and above the reset/filter bar, when shown)
// via flexbox instead of hand-calibrated calc(100vh-Npx) constants.
export const DIAGRAM_CONTAINER_CLASS = 'flex flex-col flex-1 min-h-0 relative';

export const getTitleClass = (isDark: boolean) => classNames(
  'text-[27px] font-semibold leading-[1.2] tracking-[-0.27px]',
  isDark ? 'text-[#F3F3F7]' : 'text-[#141414]',
);

export const getSubtitleClass = (isDark: boolean) => classNames(
  'items-center flex flex-wrap gap-2.5 text-[13px] font-normal',
  isDark ? 'text-[#A7A9B4]' : 'text-[#4E5156]',
);

const ACTION_BTN_BASE = 'items-center rounded-[9px] cursor-pointer flex text-[13px] font-medium gap-2 h-[38px] px-[15px] transition-all duration-200 ease-in-out border border-solid whitespace-nowrap';

export const getFilterBtnClass = (isDark: boolean) => classNames(
  ACTION_BTN_BASE,
  isDark ? 'bg-[#14151D] border-[#24262F] text-[#F3F3F7]' : 'bg-white border-[#E6E6EA] text-[#141414]',
);

export const getSettingsGroupClass = (isDark: boolean) => classNames(
  'items-stretch border border-solid rounded-[9px] flex overflow-hidden transition-[border-color] duration-200 ease-in-out',
  isDark ? 'bg-[#14151D] border-[#24262F]' : 'bg-white border-[#E6E6EA]',
);

export const getSettingsBtnClass = (isDark: boolean) => classNames(
  'items-center bg-transparent border-0 cursor-pointer flex text-[13px] font-medium gap-2 h-[38px] px-[15px] transition-all duration-200 ease-in-out whitespace-nowrap',
  isDark ? 'text-[#F3F3F7]' : 'text-[#141414]',
);

export const getSettingsCaretClass = (isDark: boolean) => classNames(
  'items-center bg-transparent border-0 border-l border-solid cursor-pointer flex text-[9px] px-2.5 h-[38px] transition-all duration-200 ease-in-out',
  isDark ? 'border-l-[#2d2f3a] text-[#A7A9B4]' : 'border-l-[#EDEDF0] text-[#8A8C97]',
);

export const EXPORT_BTN_CLASS = 'items-center bg-brand-primary border-0 rounded-[9px] text-white cursor-pointer flex text-[13px] font-semibold gap-2 h-[38px] px-[17px] shadow-[0_4px_16px_rgba(147,107,218,0.35)] transition-all duration-200 ease-in-out whitespace-nowrap hover:opacity-90';

// Dark/Light theme switch — neutral track + white(dark)/purple(light) thumb
export const getThemeSwitchClass = (isDark: boolean) => classNames(
  'border border-solid',
  isDark ?
    'border-[#24262F] data-[state=checked]:bg-[#1A1B24] data-[state=unchecked]:bg-[#1A1B24]' :
    'border-[#E6E6EA] data-[state=checked]:bg-[#F7F7FB] data-[state=unchecked]:bg-[#F7F7FB] [&_[data-slot=switch-thumb]]:bg-brand-primary',
);

export const getThemeLabelClass = (active: boolean, isDark: boolean) => classNames(
  'transition-colors duration-200 ease-in-out',
  active ?
    (isDark ? 'text-[#F3F3F7]' : 'text-[#141414]') :
    (isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]'),
);

// Tab row + tabs — the row divider now lives on the header section instead (see getHeaderRowClass);
// active tab is a thin 2px bottom border in brand color (no thick box/bar).
export const getTabRowClass = () => 'flex flex-wrap items-center justify-between gap-1';

export const getTabClass = (isActive: boolean, isDark: boolean) => classNames(
  'items-center cursor-pointer flex text-sm gap-1.5 py-[11px] px-[15px] -mb-px border-b-2',
  isActive ? 'border-brand-primary font-semibold' : 'border-transparent font-medium',
  isActive ? 'text-brand-primary' : (isDark ? 'text-[#A7A9B4]' : 'text-[#4E5156]'),
);

// Zoom/drag caption — relocated from the tabs row onto the canvas stage as a top-right overlay.
export const CAPTION_OVERLAY_CLASS = 'absolute top-7 right-4 p-2 text-right pointer-events-none';

export const getCaptionALineClass = (isDark: boolean) => classNames(
  'text-xs font-medium',
  isDark ? 'text-[#A7A9B4]' : 'text-[#4E5156]',
);

export const getCaptionBLineClass = (isDark: boolean) => classNames(
  'text-[11px] mt-0.5',
  isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]',
);

export const getInfoIconClass = (isActive: boolean, isDark: boolean) => classNames(
  'items-center bg-transparent border-0 rounded cursor-pointer flex text-sm justify-center p-0.5 transition-opacity duration-200 ease-in-out hover:text-brand-primary hover:opacity-100',
  isActive ? 'text-brand-primary opacity-80' : classNames(isDark ? 'text-[#e8e8e8]' : 'text-[#4a4a4a]', 'opacity-60'),
);

// LDA "View:" segmented control
export const getLdaToggleWrapClass = (isDark: boolean) => classNames(
  'items-center rounded-md flex gap-2 p-[4px_6px]',
  isDark ? 'bg-[#1A1B24]' : 'bg-[#F7F7FB]',
);

export const getLdaToggleBtnClass = (active: boolean, isDark: boolean) => classNames(
  'border-0 rounded-md cursor-pointer text-xs font-medium py-1 px-3 transition-all duration-200 ease-in-out',
  active ?
    'bg-brand-primary text-white' :
    classNames('hover:opacity-80', isDark ? 'bg-transparent text-[#A7A9B4]' : 'bg-transparent text-[#4E5156]'),
);
