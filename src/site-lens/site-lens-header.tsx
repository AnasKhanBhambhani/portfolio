import React, {useEffect, useRef} from 'react';
import {Checkbox} from '@/shared/ui/checkbox';
import {Switch} from '@/shared/ui/switch';
import {SimpleTooltip} from '@/shared/ui/composed/simple-tooltip';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCog, faCircleInfo, faDownload, faFilter, faSpinnerThird} from '@fortawesome/pro-regular-svg-icons';
import {faChevronDown} from '@fortawesome/pro-solid-svg-icons';
import type {TTheme} from './types';
import {ORPHAN_BADGE_TOOLTIP} from './constants';
import {
  getHeaderMainContainerClass,
  HEADER_ROW_CLASS,
  getTitleClass,
  getSubtitleClass,
  getFilterBtnClass,
  getSettingsGroupClass,
  getSettingsBtnClass,
  getSettingsCaretClass,
  EXPORT_BTN_CLASS,
  getThemeSwitchClass,
  getThemeLabelClass,
  getTabRowClass,
  getTabClass,
  getInfoIconClass,
  getLdaToggleWrapClass,
  getLdaToggleBtnClass,
} from './tailwind';

const checkboxRowClasses = 'items-center flex justify-between mx-3 py-3 px-1 text-sm font-medium whitespace-nowrap';

interface ISiteLensHeaderProps {
  type: number;
  setType: (type: number) => void;
  theme: TTheme;
  setTheme: (theme: TTheme) => void;
  isDark: boolean;
  loadingDepthNodes: boolean;
  depthNodesGraph: any;
  showDisplaySettings: boolean;
  setShowDisplaySettings: (show: boolean) => void;
  isPageSelectorOpen: boolean;
  setIsPageSelectorOpen: (open: boolean) => void;
  showPrunable: boolean;
  setShowPrunable: (show: boolean) => void;
  hideOrphans: boolean;
  setHideOrphans: (hide: boolean) => void;
  showWatermark: boolean;
  setShowWatermark: (show: boolean) => void;
  orphanCount: number;
  ldaViewMode: 'bubbles' | 'ldavis';
  setLdaViewMode: (mode: 'bubbles' | 'ldavis') => void;
  handleInfoClick: (e: React.MouseEvent, visualizationType: string) => void;
  handleExportPNG: () => void;
}

export const SiteLensHeader: React.FC<ISiteLensHeaderProps> = ({
  type,
  setType,
  theme,
  setTheme,
  isDark,
  loadingDepthNodes,
  depthNodesGraph,
  showDisplaySettings,
  setShowDisplaySettings,
  isPageSelectorOpen,
  setIsPageSelectorOpen,
  showPrunable,
  setShowPrunable,
  hideOrphans,
  setHideOrphans,
  showWatermark,
  setShowWatermark,
  orphanCount,
  ldaViewMode,
  setLdaViewMode,
  handleInfoClick,
  handleExportPNG,
}) => {
  const antIcon = <FontAwesomeIcon icon={faSpinnerThird} className='text-sm text-brand-primary [stroke-width:30px]' spin />;

  const disabledClass = loadingDepthNodes ? '!cursor-not-allowed opacity-70' : '';

  // Closes on any outside pointerdown (including over the 2D/3D canvas) via DOM containment,
  // not a full-screen overlay's stacking order — a fixed-position click-catcher silently stops
  // working if any ancestor gets a transform/filter/backdrop-filter (as this page's backdrop
  // does), since that makes the fixed element's containing block that ancestor instead of the
  // viewport, which can put it visually beneath the canvas.
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showDisplaySettings) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (!settingsPanelRef.current?.contains(event.target as Node)) {
        setShowDisplaySettings(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showDisplaySettings, setShowDisplaySettings]);

  return (
    <div className={getHeaderMainContainerClass(isDark)}>
      <div className={getTabRowClass()}>
        <div className='flex'>
          <div className={getTabClass(type === 4, isDark)} onClick={() => setType(4)}>
            <span>3D Graph</span>
            <SimpleTooltip title='Click to learn about this view'>
              <button
                className={getInfoIconClass(type === 4, isDark)}
                onClick={e => handleInfoClick(e, '3d-crawl-diagram')}
                aria-label='Info about 3D Graph'
                tabIndex={0}
              >
                <FontAwesomeIcon icon={faCircleInfo} />
              </button>
            </SimpleTooltip>
          </div>
          <div className={getTabClass(type === 5, isDark)} onClick={() => setType(5)}>
            <span>2D Graph</span>
            <SimpleTooltip title='Click to learn about this view'>
              <button
                className={getInfoIconClass(type === 5, isDark)}
                onClick={e => handleInfoClick(e, 'node-cluster-diagram')}
                aria-label='Info about 2D Graph'
                tabIndex={0}
              >
                <FontAwesomeIcon icon={faCircleInfo} />
              </button>
            </SimpleTooltip>
          </div>
          {/* <div className={getTabClass(type === 3, isDark)} onClick={() => setType(3)}>Nodes</div> */}
          <div className={getTabClass(type === 1, isDark)} onClick={() => setType(1)}>
            <span>Tree Diagram</span>
            <SimpleTooltip title='Click to learn about this view'>
              <button
                className={getInfoIconClass(type === 1, isDark)}
                onClick={e => handleInfoClick(e, 'tree-diagram')}
                aria-label='Info about Tree Diagram'
                tabIndex={0}
              >
                <FontAwesomeIcon icon={faCircleInfo} />
              </button>
            </SimpleTooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
