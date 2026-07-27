import {useMemo} from 'react';
import {TTheme} from '../types';
import {getVisualizationThemeColors} from '../functions';

export const useVisualizationTheme = (theme: TTheme) => {
  return useMemo(() => getVisualizationThemeColors(theme), [theme]);
};

export const useCrawlTreeTheme = (theme: TTheme) => {
  return useMemo(() => ({
    background: theme === 'light' ? '#f5f5f5' : '#121317',
    text: theme === 'light' ? '#333333' : '#E8E8E8',
    textSecondary: theme === 'light' ? '#666666' : '#A3A4A4',
    lineColor: theme === 'light' ? '#cccccc' : '#4E5156',
    nodeStroke: theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
    buttonBg: theme === 'light' ? 'rgba(127, 78, 173, 0.15)' : 'rgba(127, 78, 173, 0.4)',
    buttonBgInactive: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
    buttonBorder: theme === 'light' ? 'rgba(127, 78, 173, 0.5)' : '#7F4EAD',
    buttonBorderInactive: theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    tooltipBg: theme === 'light' ? '#ffffff' : '#1a1a1a',
    tooltipBorder: theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)',
  }), [theme]);
};

export const useLdaTheme = (theme: TTheme) => {
  return useMemo(() => ({
    bg: theme === 'dark' ? '#24262A' : '#f5f5f5',
    text: theme === 'dark' ? '#E8E8E8' : '#333333',
    subtext: theme === 'dark' ? '#888' : '#666',
    cardBg: theme === 'dark' ? '#1a1b1f' : '#ffffff',
    border: theme === 'dark' ? '#4E5156' : '#e0e0e0',
  }), [theme]);
};

export const useChordTheme = (theme: TTheme) => {
  return useMemo(() => ({
    panel: {
      background: theme === 'dark' ? '#1a1b1f' : '#ffffff',
      border: theme === 'dark' ? '#4E5156' : '#e0e0e0',
      text: theme === 'dark' ? '#E8E8E8' : '#333333',
      subtext: theme === 'dark' ? '#888' : '#666',
      listBg: theme === 'dark' ? '#24262A' : '#f5f5f5',
    },
  }), [theme]);
};

export {default as useFilterDrawerData, DEFAULT_EXPAND_DEPTH} from './use-filter-drawer-data';


export {useOrphanNodes} from './use-orphan-nodes';
export {useExportVisualization} from './use-export-visualization';
export {useECharts, disposeEChartsInDom} from './use-echarts';

