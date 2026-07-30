import React from 'react';
import {Slider} from '@/shared/ui/slider';
import {Switch} from '@/shared/ui/switch';
import {ChevronDownIcon} from 'lucide-react';
import {DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from '@/shared/ui/dropdown-menu';
import {cn} from '@/shared/lib/utils';
import {SimpleTooltip} from '@/shared/ui/composed/simple-tooltip';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight, faSliders, faRotateLeft} from '@fortawesome/pro-regular-svg-icons';
import {SIZE_OPTIONS, COLOR_OPTIONS} from '../../../../../constants';
import type {TTheme} from '../../../../../types';
import {
  SELECT_TRIGGER_CLASSES,
  SELECT_CONTENT_CLASSES,
  SELECT_ITEM_CLASSES,
  NODES_ON_DRAG_CLASS,
  FULL_SLIDER_CLASS,
  getStyledSizeTriggerClass,
  getStyledSizeItemClass,
  getStyledSizeContentClass,
  getSettingsSliderOverrides,
  getSettingsPanelCollapsedClass,
  getSettingsPanelExpandedClass,
  getResetButtonClass,
} from './graph-tailwind';

const sizes = SIZE_OPTIONS;

interface IGraphSettingsPanelProps {
  theme: TTheme;
  showSettingsPanel: boolean;
  setShowSettingsPanel: (v: boolean) => void;
  // Settings values
  nodesFixOnDrag: boolean;
  handleNodesFixOnDrag: (v: boolean) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  sizeBy: string;
  handleChange: (v: string) => void;
  isSizeDropdownOpen: boolean;
  setIsSizeDropdownOpen: (v: boolean) => void;
  colorBy: string;
  handleColorByChange: (v: string) => void;
  isColorDropdownOpen: boolean;
  setIsColorDropdownOpen: (v: boolean) => void;
  colorOptionsWithDisabled: Array<{value: string; label: string; disabled: boolean; disabledReason: string}>;
  // Sliders
  expandToLevel: number;
  maxDepthValue: number;
  onDepthLevelChange: (v: number) => void;
  resetAllStates: () => void;
}

export const GraphSettingsPanel: React.FC<IGraphSettingsPanelProps> = ({
  theme,
  showSettingsPanel,
  setShowSettingsPanel,
  nodesFixOnDrag,
  handleNodesFixOnDrag,
  showLabels,
  setShowLabels,
  sizeBy,
  handleChange,
  isSizeDropdownOpen,
  setIsSizeDropdownOpen,
  colorBy,
  handleColorByChange,
  isColorDropdownOpen,
  setIsColorDropdownOpen,
  colorOptionsWithDisabled,
  expandToLevel,
  maxDepthValue,
  onDepthLevelChange,
  resetAllStates,
}) => {
  const isDark = theme === 'dark';
  const settingsSliderOverrides = getSettingsSliderOverrides(isDark);
  const styledSizeTriggerClass = getStyledSizeTriggerClass(isDark);
  const styledSizeItemClass = getStyledSizeItemClass(isDark);
  const styledSizeContentClass = getStyledSizeContentClass(isDark);

  if (!showSettingsPanel) {
    return (
      <div className={getSettingsPanelCollapsedClass(isDark)}>
        <div className={`flex items-center justify-center p-2 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
          <FontAwesomeIcon icon={faSliders} />
        </div>
        <button
          className={`flex items-center justify-center bg-transparent border-0 cursor-pointer h-7 w-7 mb-1.5 rounded-[7px] transition-colors duration-150 ${isDark ? 'text-[#888] hover:bg-[#2f3134]' : 'text-[#666] hover:bg-[#f0f0f0]'}`}
          type='button'
          onClick={() => setShowSettingsPanel(true)}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn(getSettingsPanelExpandedClass(isDark), settingsSliderOverrides)} data-theme={theme}>
      <div className='flex items-center justify-between mb-2.5'>
        <span className={`flex items-center gap-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
          <FontAwesomeIcon icon={faSliders} className='text-brand-primary' /> Display Settings
        </span>
        <button
          className={`bg-transparent border-0 cursor-pointer p-1 rounded ${isDark ? 'text-white hover:bg-[#3a3c40]' : 'text-[#666] hover:bg-[#f0f0f0]'}`}
          onClick={() => setShowSettingsPanel(false)}
          type='button'
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      </div>
      <div className='flex flex-col gap-2 py-2'>
        <div className='flex flex-col gap-2 mb-3 last:mb-0'>
          <span className={`font-['Manrope',sans-serif] text-sm font-normal ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Size nodes by</span>
          <SimpleTooltip title={sizes.find(o => o.value === sizeBy)?.label ?? sizeBy} placement='right' color='#000' open={isSizeDropdownOpen ? false : undefined}>
            <DropdownMenu onOpenChange={open => setIsSizeDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className={cn(SELECT_TRIGGER_CLASSES, styledSizeTriggerClass, 'w-full min-w-0 max-w-none')}
                  style={{backgroundColor: isDark ? 'transparent' : undefined, color: isDark ? 'white' : '#1a1a1a'}}
                >
                  <span className='pointer-events-none min-w-0 block truncate'>{sizes.find(o => o.value === sizeBy)?.label ?? sizeBy}</span>
                  <ChevronDownIcon className='size-4 opacity-50' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='center' className={cn(SELECT_CONTENT_CLASSES, styledSizeContentClass)}>
                <DropdownMenuRadioGroup value={sizeBy} onValueChange={handleChange}>
                  {sizes.map(opt => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value} className={cn(SELECT_ITEM_CLASSES, styledSizeItemClass)}>
                      <SimpleTooltip title={opt.label} placement='right' color='#000' overlayInnerStyle={{whiteSpace: 'nowrap', maxWidth: 'none'}}>
                        <span className='block truncate'>{opt.label}</span>
                      </SimpleTooltip>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SimpleTooltip>
        </div>

        <div className='flex flex-col gap-2 mb-3 last:mb-0'>
          <SimpleTooltip title='Choose the metric that determines node colors'>
            <span className={`inline-block font-['Manrope',sans-serif] text-sm font-normal ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Color nodes by</span>
          </SimpleTooltip>
          <SimpleTooltip title={COLOR_OPTIONS.find(o => o.value === colorBy)?.label ?? colorBy} placement='right' color='#000' open={isColorDropdownOpen ? false : undefined}>
            <DropdownMenu onOpenChange={open => setIsColorDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className={cn(SELECT_TRIGGER_CLASSES, styledSizeTriggerClass, 'w-full min-w-0 max-w-none')}
                  style={{backgroundColor: isDark ? 'transparent' : undefined, color: isDark ? 'white' : '#1a1a1a'}}
                >
                  <span className='pointer-events-none min-w-0 block truncate'>
                    {COLOR_OPTIONS.find(o => o.value === (colorBy && COLOR_OPTIONS.some(opt => opt.value === colorBy) ? colorBy : 'pageHealth'))?.label}
                  </span>
                  <ChevronDownIcon className='size-4 opacity-50' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='center' className={cn(SELECT_CONTENT_CLASSES, styledSizeContentClass)}>
                <DropdownMenuRadioGroup
                  value={colorBy && COLOR_OPTIONS.some(opt => opt.value === colorBy) ? colorBy : 'pageHealth'}
                  onValueChange={handleColorByChange}
                >
                  {colorOptionsWithDisabled.map(option => (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={cn(SELECT_ITEM_CLASSES, styledSizeItemClass)}
                    >
                      <SimpleTooltip title={option.disabled && option.disabledReason ? option.disabledReason : option.label} placement='right' color='#000' overlayInnerStyle={{whiteSpace: 'nowrap', maxWidth: 'none'}} className={option.disabled ? 'pointer-events-auto' : undefined}>
                        <span className={`block truncate ${option.disabled ? `${theme === 'dark' ? 'text-[#666]' : 'text-[#999]'} opacity-60` : 'opacity-100'}`}>
                          {option.label}
                        </span>
                      </SimpleTooltip>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SimpleTooltip>
        </div>

        <div className='flex flex-col gap-2 mb-3 last:mb-0'>
          <div className='flex items-center justify-between'>
            <span className={`font-['Manrope',sans-serif] text-sm font-normal ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Max Depth</span>
            <span className='text-sm font-semibold text-brand-primary'>{expandToLevel}</span>
          </div>
          <Slider
            className={FULL_SLIDER_CLASS}
            min={0}
            max={maxDepthValue}
            onValueChange={([v]) => onDepthLevelChange(v)}
            value={[expandToLevel]}
          />
        </div>
      </div>

      <div className='flex flex-col gap-3 mt-3'>
        <div className={NODES_ON_DRAG_CLASS}>
          <span className={`shrink-0 font-['Manrope',sans-serif] text-sm font-normal ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Show labels</span>
          <Switch checked={showLabels} onCheckedChange={checked => setShowLabels(!!checked)} />
        </div>
        <div className={NODES_ON_DRAG_CLASS}>
          <span className={`shrink-0 font-['Manrope',sans-serif] text-sm font-normal ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Fix nodes on drag</span>
          <Switch checked={nodesFixOnDrag} onCheckedChange={checked => handleNodesFixOnDrag(!!checked)} />
        </div>
      </div>

      <div className='mt-3.5'>
        <button
          type='button'
          className={getResetButtonClass(isDark)}
          onClick={() => resetAllStates()}
        >
          <FontAwesomeIcon icon={faRotateLeft} fontSize={11} /> Reset view
        </button>
      </div>
    </div>
  );
};
