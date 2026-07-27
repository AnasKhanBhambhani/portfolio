import React, {useEffect, useState, useMemo} from 'react';
import {init, getInstanceByDom} from 'echarts';
import {renderToString} from 'react-dom/server';
import {getProgressColor} from '@/utils/colors';
import {useModuleHeader} from '@/shared/hooks';
import {useSiteLensDepthData} from './hooks/use-site-lens-depth-data';
import {useCommonStore} from '@/store/hooks/useCommonStore';
import {getLocalStorageItem, setLocalStorageItem} from '@/utils/safe-localStorage';
import type {TTheme, FilterMode, IMetricRanges} from './types';
import {useHandleExportPNG} from './use-handle-export-png';
import {useTheme as usePortfolioTheme} from '../context/ThemeContext';

export const useSiteLens = () => {
  const [type, setType] = useState(4);
  // const [showLabels, setShowLabels] = useState(false);
  const [nodeSizeBy] = useState('impressions');
  // Site Lens's own header theme switch was removed (embedded page now follows
  // the portfolio's site-wide light/dark toggle instead of having its own).
  // Seed from — and stay in sync with — that global theme rather than a
  // hardcoded 'dark' default.
  const {theme: portfolioTheme} = usePortfolioTheme();
  const [theme, setTheme] = useState<TTheme>(portfolioTheme);
  useEffect(() => {
    setTheme(portfolioTheme);
  }, [portfolioTheme]);
  const [showWatermark, setShowWatermark] = useState<boolean>(() => {
    const stored = getLocalStorageItem('showWatermark');
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [showDisplaySettings, setShowDisplaySettings] = useState<boolean>(false);
  const [isPageSelectorOpen, setIsPageSelectorOpen] = useState<boolean>(false);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<number>>(new Set());
  const [filterMode, setFilterMode] = useState<FilterMode>('deemphasize');
  const [metricRanges, setMetricRanges] = useState<IMetricRanges>({});
  const [metricBounds, setMetricBounds] = useState<{[key: string]: {min: number; max: number}}>({});
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false);
  const [activeVisualizationInfo, setActiveVisualizationInfo] = useState<string>('');
  const [showPrunable, setShowPrunable] = useState<boolean>(false);
  const [hideOrphans, setHideOrphans] = useState<boolean>(true);
  const [ldaViewMode, setLdaViewMode] = useState<'bubbles' | 'ldavis'>('ldavis');
  const [showExportToast, setShowExportToast] = useState<boolean>(false);
  const {
    lastDepthNode,
    depthNodesGraph,
    loadingDepthNodes,
  } = useSiteLensDepthData(nodeSizeBy);
  const {settings: {customer: {profile}}} = useCommonStore();
  const watermarkLogoUrl = useMemo(() => {
    if (profile?.isWhitelabel && profile?.logo && !String(profile.logo).includes('/Logo_SVG.svg')) {
      return profile.logo;
    }
    return undefined;
  }, [profile?.isWhitelabel, profile?.logo]);
  const [, setNodesClone] = useState(null);

  const orphanNodes = useMemo(() => {
    if (!depthNodesGraph) return [];
    const nodes = (depthNodesGraph as any).nodes || [];
    const links = (depthNodesGraph as any).links || [];
    const targetNodeIds = new Set<number>();
    links.forEach((link: any) => {
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (targetId !== undefined && targetId !== null) {
        targetNodeIds.add(targetId);
      }
    });
    return nodes.map((node: any) => {
      const hasIncomingLinks = targetNodeIds.has(node.id);
      const isOrphan = !hasIncomingLinks && (node.depth ?? 0) > 0;
      return {
        ...node,
        isOrphan,
      };
    });
  }, [depthNodesGraph]);

  const orphanCount = useMemo(() => {
    return orphanNodes.filter((node: any) => node.isOrphan === true).length;
  }, [orphanNodes]);

  const orphanNodeIds = useMemo(() => {
    const ids = new Set<number>();
    orphanNodes.forEach((node: any) => {
      if (node.isOrphan === true) {
        ids.add(node.id);
      }
    });
    return ids;
  }, [orphanNodes]);

  const filteredNodesGraph = useMemo(() => {
    if (!depthNodesGraph) return depthNodesGraph;
    if (!hideOrphans) return depthNodesGraph;

    const filteredNodes = orphanNodes.filter((node: any) => !node.isOrphan);
    const filteredNodeIds = new Set(filteredNodes.map((n: any) => n.id));
    const filteredLinks = ((depthNodesGraph as any).links || []).filter((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return {
      ...depthNodesGraph,
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [depthNodesGraph, hideOrphans, orphanNodes]);

  useEffect(() => {
    if (depthNodesGraph) {
      const nodes = depthNodesGraph['nodes'];
      setNodesClone(nodes);
    }
  }, [depthNodesGraph, type]);

  useEffect(() => {
    setLocalStorageItem('showWatermark', JSON.stringify(showWatermark));
  }, [showWatermark]);

  useEffect(() => {
    const threeDForceGraphElement = document.getElementById('three-d-force-graph');
    if (threeDForceGraphElement && type === 3 && filteredNodesGraph) {
      // LPS-352: dispose any existing ECharts instance before re-initializing.
      // Without this, switching tabs or theme leaks renderer canvases.
      const existing = getInstanceByDom(threeDForceGraphElement);
      existing?.dispose();
      const graphInstance = init(threeDForceGraphElement);
      const processedNodes = ((filteredNodesGraph as any).nodes || []).map((node: any) => ({
        ...node,
        itemStyle: (showPrunable && node.isPrunable) ? {
          borderWidth: 3,
          borderColor: '#E74C3C',
        } : undefined,
      }));

      graphInstance?.setOption({
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          enterable: true,
          appendToBody: true,
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 2,
          padding: 20,
          backgroundColor: '#000',
          formatter: function(item: any) {
            if (!item.data.name) return null;
            const element = (
              <div>
                <div className='text-white max-w-[400px] overflow-hidden text-ellipsis'>{item.name}</div>
                <div><a className='block max-w-[400px] overflow-hidden text-ellipsis' href={item.data.url} target='_blank' rel='noreferrer'>{item.data.url}</a></div>
                <div className='flex justify-between text-white'>
                  <div>
                    <div>Depth:</div>
                    <div>Health:</div>
                    <div>Issues:</div>
                    <div>Status:</div>
                  </div>
                  <div>
                    <div>{item.data.depth ?? '-'}</div>
                    <div className='flex items-center'>
                      {item.data.pageHealth !== null && <div className='rounded-full h-[5px] mr-[5px] w-[5px]' style={{backgroundColor: getProgressColor(item.data.pageHealth * 100 || 0, 25, 50, 75)}}/>}
                      <div>{item.data.pageHealth ?? '-' }</div>
                    </div>
                    <div className='flex items-center'>
                      <div className='rounded-full h-[5px] mr-[5px] w-[5px]' style={{backgroundColor: item.data.issueCount ? '#F44343' : '#2AC155'}}/>
                      <div>{item.data.issueCount || 'None' }</div>
                    </div>
                    <div className='flex items-center'>
                      <div className='rounded-full h-[5px] mr-[5px] w-[5px]' style={{backgroundColor: item.data.status !== 'Active' ? '#F44343' : '#2AC155'}}/>
                      <div>{item.data.status ?? '-' }</div>
                    </div>
                  </div>
                </div>
              </div>);
            return renderToString(element);
          },
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            label: {
              color: '#fff',
            },
            zoom: 0.5,
            roam: true,
            data: processedNodes,
            links: (filteredNodesGraph as any).links,
            categories: (filteredNodesGraph as any).categories,
            force: {
              repulsion: 100,
            },
          },
        ],
      }, true);
    }

    // LPS-352: dispose ECharts instance on unmount or when deps change so the
    // canvas/renderer is released and we don't accumulate hidden charts.
    return () => {
      if (threeDForceGraphElement) {
        const instance = getInstanceByDom(threeDForceGraphElement);
        instance?.dispose();
      }
    };
  }, [filteredNodesGraph, type, showPrunable, theme]);


  // useSiteLensDepthData internally resolves siteId from router/MobX/localStorage
  // and triggers the depth-nodes query, replacing the legacy
  // updateSelectedSiteSA + loadDepthNodesV2 chain.

  useModuleHeader({});

  const handleInfoClick = (e: React.MouseEvent, visualizationType: string): void => {
    e.stopPropagation();
    setActiveVisualizationInfo(visualizationType);
    setInfoModalOpen(true);
  };

  const handleExportPNG = useHandleExportPNG(type, theme);

  const isDark = theme === 'dark';

  return {
    type,
    setType,
    theme,
    setTheme,
    showWatermark,
    setShowWatermark,
    showDisplaySettings,
    setShowDisplaySettings,
    isPageSelectorOpen,
    setIsPageSelectorOpen,
    selectedPageIds,
    setSelectedPageIds,
    filterMode,
    setFilterMode,
    metricRanges,
    setMetricRanges,
    metricBounds,
    setMetricBounds,
    infoModalOpen,
    setInfoModalOpen,
    activeVisualizationInfo,
    showPrunable,
    setShowPrunable,
    hideOrphans,
    setHideOrphans,
    ldaViewMode,
    setLdaViewMode,
    showExportToast,
    setShowExportToast,
    lastDepthNode,
    depthNodesGraph,
    loadingDepthNodes,
    watermarkLogoUrl,
    orphanCount,
    orphanNodeIds,
    filteredNodesGraph,
    handleInfoClick,
    handleExportPNG,
    isDark,
  };
};
