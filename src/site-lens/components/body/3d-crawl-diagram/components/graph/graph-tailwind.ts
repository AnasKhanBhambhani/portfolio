import classNames from 'classnames';
import type {TTheme} from '../../../../../types';

export const getCanvasShellClass = (theme: TTheme) => classNames(
  'rounded-[14px] min-h-[400px] h-full min-w-0 relative w-full overflow-hidden border border-solid [&_canvas]:!w-full',
  theme === 'dark' ?
    'bg-[radial-gradient(circle_at_50%_42%,#0f101a,#050507)] border-[#24262F]' :
    'bg-[radial-gradient(circle_at_50%_42%,#f6f6fb,#e7e5f0)] border-[#E6E6EA]',
);

export const SELECT_TRIGGER_CLASSES = classNames(
  'cursor-pointer flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs',
  'transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'disabled:cursor-not-allowed disabled:opacity-50 h-9',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
);

export const SELECT_CONTENT_CLASSES = classNames(
  'border border-border shadow-sm',
  'max-h-[min(var(--radix-dropdown-menu-content-available-height),300px)] min-w-[var(--radix-dropdown-menu-trigger-width)]',
  // Thin, unobtrusive scrollbar (matches the raw-JSON editor) instead of the chunky default.
  '[&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-[rgba(120,118,110,0.35)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(120,118,110,0.55)] [&::-webkit-scrollbar-track]:bg-transparent',
  '[scrollbar-width:thin] [scrollbar-color:rgba(120,118,110,0.35)_transparent]',
);

export const SELECT_ITEM_CLASSES = 'cursor-pointer pl-2 [&>span:first-child]:hidden';

export const getUrlSearchSelectTriggerClass = (isDark: boolean) => classNames(
  'flex w-full items-center justify-between gap-2 rounded-md border border-solid h-[30px] px-2.5 text-sm cursor-pointer bg-transparent',
  isDark ? 'border-[#24262F] text-white' : 'border-[#E6E6EA] text-[#141414]',
  'hover:border-brand-primary',
  'focus-visible:border-brand-primary focus-visible:outline-none',
);

export const getUrlSearchSelectContentClass = (isDark: boolean) => classNames(
  'w-[var(--radix-popover-trigger-width)] max-w-[350px] p-0! border border-solid rounded-lg overflow-hidden',
  isDark ? 'bg-[#14151D]! border-[#24262F]' : 'bg-white! border-[#E6E6EA]',
);

// Toggle row: label on the left, switch on the right.
export const NODES_ON_DRAG_CLASS = 'flex items-center justify-between';

// Shared slider styling (thumb/track/range) — width is applied per usage via the variants below.
// The thumb is a circular white knob with a soft brand-colored radial halo (see getSettingsSliderOverrides).
export const STYLED_SLIDER_CLASS = classNames(
  '[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:rounded-full [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-solid',
  '[&_[data-slot=slider-track]]:bg-[#444648] [&_[data-slot=slider-track]]:rounded-sm [&_[data-slot=slider-track]]:h-1',
  '[&_[data-slot=slider-range]]:bg-brand-primary [&_[data-slot=slider-range]]:rounded-sm',
);

// Full-width slider (label-on-top layout: Max Depth / Link Length).
export const FULL_SLIDER_CLASS = classNames(STYLED_SLIDER_CLASS, 'w-full');

// Fixed-width slider that sits beside a numeric input (Advanced Options).
export const ADVANCED_SLIDER_CLASS = classNames(STYLED_SLIDER_CLASS, 'shrink-0 w-[121px] max-w-[121px] min-w-[121px]');

export const getStyledNumberInputClass = (isDark: boolean) => classNames(
  'border-0! rounded-md m-0 w-[46px]! h-[30px] shrink-0 text-center px-1 shadow-none! focus-visible:ring-0!',
  isDark ? 'bg-[#1A1B24]! text-white' : 'bg-[#F7F7FB]! text-[#141414]',
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
);

export const getStyledSizeTriggerClass = (isDark: boolean) => classNames(
  'shrink-0 w-[180px] max-w-[180px] min-w-[180px] rounded-lg h-9 px-3 py-0 text-sm border border-solid',
  isDark ? 'bg-transparent border-[#24262F] text-white! data-[placeholder]:text-white! [&_span]:text-white!' : 'bg-[#F7F7FB] border-[#E6E6EA] text-[#141414]! [&_span]:text-[#141414]!',
  'hover:border-brand-primary',
  isDark ? 'hover:bg-[#363646]!' : 'hover:bg-[#f0f0f5]!',
  'focus-visible:border-brand-primary/30! focus-visible:ring-[2px]! focus-visible:ring-[rgba(127,78,173,0.2)]!',
  isDark ? '[&>svg]:text-white!' : '[&>svg]:text-[#4E5156]!',
);

export const getStyledSizeItemClass = (isDark: boolean) => classNames(
  'rounded mx-2 my-0.5 w-auto! min-w-0 transition-all duration-200 ease-in-out',
  isDark ? 'text-white' : 'text-[#1a1a1a]',
  'data-[state=checked]:bg-brand-primary! data-[state=checked]:text-white! data-[state=checked]:font-medium',
  isDark ?
    'focus:bg-[rgba(127,78,173,0.25)]! focus:text-white!' :
    'focus:bg-[rgba(127,78,173,0.1)]! focus:text-[#1a1a1a]!',
  'data-[disabled]:cursor-not-allowed',
  isDark ? 'data-[disabled]:text-[#666] data-[disabled]:opacity-70' : 'data-[disabled]:text-[#999] data-[disabled]:opacity-60',
);

export const getStyledSizeContentClass = (isDark: boolean) => classNames(
  'rounded-lg py-1 px-0 w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)]',
  isDark ? 'bg-[#14151D] border border-solid border-[#24262F]' : 'bg-white border border-solid border-[#E6E6EA]',
);


export const getSettingsSliderOverrides = (isDark: boolean) => classNames(
  isDark ? '[&_[data-slot=slider-track]]:bg-[#1A1B24]' : '[&_[data-slot=slider-track]]:bg-[#F7F7FB]',
  '[&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-[color:var(--color-brand-primary)]',
  '[&_[data-slot=slider-thumb]]:shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
);

// Left-side overlay column: settings panel pinned to the top, page-health legend to the bottom.
// top-4/bottom-4 match left-4 so the column sits an equal 16px from all three edges. Spanning
// top→bottom lets flexbox bound the panel's height so it scrolls instead of growing behind the
// legend. pointer-events-none keeps the transparent gap between them click-through to the canvas;
// only the panel/legend boxes capture events.
export const LEFT_OVERLAY_STACK_CLASS = classNames(
  'absolute left-4 top-4 bottom-4 z-[7] flex flex-col items-start gap-2 max-w-[300px]',
  'pointer-events-none [&>*]:pointer-events-auto',
);

export const getSettingsPanelCollapsedClass = (isDark: boolean) => classNames(
  'flex flex-col items-center border border-solid rounded-[14px] h-fit overflow-hidden',
  isDark ? 'shadow-[0_10px_40px_rgba(0,0,0,0.35)]' : 'shadow-[0_-4px_24px_rgba(0,0,0,0.35)]',
  isDark ? 'bg-[#14151D] border-[#24262F]' : 'bg-white border-[#E6E6EA]',
);

export const getSettingsPanelExpandedClass = (isDark: boolean) => classNames(
  'border border-solid rounded-[14px] max-w-[300px] min-w-[300px] p-4 w-[300px] min-h-0',
  'overflow-y-auto backdrop-blur-[8px]',
  isDark ? 'shadow-[0_10px_40px_rgba(0,0,0,0.35)]' : 'shadow-[0_-4px_24px_rgba(0,0,0,0.35)]',
  // Thin webkit thumb scrollbar (matches the URL-search dropdown) instead of the chunky default.
  '[&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [scrollbar-width:thin]',
  isDark ?
    '[&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.2)] [scrollbar-color:rgba(255,255,255,0.2)_transparent]' :
    '[&::-webkit-scrollbar-thumb]:bg-[rgba(0,0,0,0.15)] [scrollbar-color:rgba(0,0,0,0.15)_transparent]',
  isDark ? 'bg-[#14151D] border-[#24262F]' : 'bg-white border-[#E6E6EA]',
);

export const getResetButtonClass = (isDark: boolean) => classNames(
  'flex items-center justify-center gap-2 w-full h-[34px] rounded-lg border border-solid cursor-pointer',
  `font-['Manrope',sans-serif] text-[12.5px] font-semibold`,
  isDark ? 'bg-[#1A1B24] border-[#24262F] text-[#A7A9B4]' : 'bg-[#F7F7FB] border-[#E6E6EA] text-[#4E5156]',
);

export const ZOOM_CONTAINER_CLASS = 'flex flex-col absolute right-4 bottom-4 z-[7]';

export const LEGEND_WRAP_CLASS = 'mt-auto shrink-0 rounded-xl border border-solid py-3 px-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]';

export const getLegendWrapThemeClass = (isDark: boolean) => classNames(
  isDark ? 'bg-[#14151D] border-[#24262F]' : 'bg-white border-[#E6E6EA]',
);

export const getLegendTitleClass = (isDark: boolean) => classNames(
  'text-[10.5px] font-bold uppercase tracking-[0.06em] mb-2',
  isDark ? 'text-[#6B6D7A]' : 'text-[#9E9DA1]',
);

export const getLegendItemLabelClass = (isDark: boolean) => classNames(
  'text-xs',
  isDark ? 'text-[#A7A9B4]' : 'text-[#4E5156]',
);

export const getDetailDrawerWrapClass = (isOpen: boolean) => classNames(
  'absolute top-0 right-0 bottom-0 w-[320px] z-[20] transition-[transform,opacity] duration-[280ms] ease',
  isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0',
);

export const getDetailDrawerPanelClass = (isDark: boolean) => classNames(
  'h-full flex flex-col border-l shadow-[-16px_0_40px_rgba(0,0,0,0.28)]',
  isDark ? 'bg-[#14151D] border-[#24262F]' : 'bg-white border-[#E6E6EA]',
);
export const getDetailStatTileClass = (isDark: boolean) => classNames(
  'rounded-[10px] border border-solid p-3 transition-colors',
  isDark ?
    'bg-[#23242F] border-[#3A3C4A] shadow-[0_0_0_1px_rgba(127,78,173,0.12),0_2px_6px_rgba(0,0,0,0.3)]' :
    'bg-[#F7F7FB] border-[#E6E6EA] shadow-[0_1px_3px_rgba(20,10,60,0.06)]',
);

// Zoom controls — joined 38x38 vertical pill (top/middle/bottom share borders, no gaps between them)
export const getZoomBtnClass = (isDark: boolean, position: 'top' | 'middle' | 'bottom') => classNames(
  'flex items-center border border-solid cursor-pointer',
  'text-lg font-medium size-[38px] justify-center transition-[background,opacity] duration-150',
  'ease-in-out hover:bg-[rgba(127,78,173,0.1)] hover:opacity-80',
  'active:bg-[rgba(127,78,173,0.2)]',
  position === 'top' && 'rounded-t-[10px] border-b-0',
  position === 'bottom' && 'rounded-b-[10px] border-t-0',
  isDark ? 'bg-[#15161D] border-[#24262F] text-[#A7A9B4]' : 'bg-white border-[#E6E6EA] text-[#4E5156]',
);
