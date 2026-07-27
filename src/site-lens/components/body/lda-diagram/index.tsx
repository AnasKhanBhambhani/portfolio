import React, {useMemo, useCallback} from 'react';
import {observer} from 'mobx-react-lite';
import {useSiteLensDepthData} from '../../../hooks/use-site-lens-depth-data';
import type {ILdaDiagramProps, IGraphData, INodeData} from '../../../types';
import {METRICS} from '../../../constants';
import {getNodeBackendId, metricValuePassesRange} from '../../../functions';
import LDADiagram from './components/lda-chart';
import LDAvis from './components/ldavis-chart';

const LdaDiagram: React.FC<ILdaDiagramProps> = observer(({
  theme,
  showWatermark = true,
  watermarkLogoUrl,
  viewMode = 'bubbles',
  selectedPageIds,
  filterMode,
  metricRanges,
  metricBounds,
}) => {
  const {depthNodesGraph, loadingDepthNodes} = useSiteLensDepthData();

  const isDark = theme === 'dark';
  const graphData = depthNodesGraph as unknown as IGraphData;

  const nodePassesMetricFilters = useCallback((node: INodeData) => {
    if (!metricRanges || !metricBounds) return true;

    for (const metric of METRICS) {
      const value = node[metric.key] as number | null | undefined;
      if (!metricValuePassesRange(value, metricRanges[metric.key], metricBounds[metric.key])) {
        return false;
      }
    }

    return true;
  }, [metricRanges, metricBounds]);

  const isNodeFiltered = useCallback((node: INodeData) => {
    if (filterMode !== 'deemphasize' && filterMode !== 'remove') return false;

    let passesPageSelection = true;
    if (selectedPageIds && selectedPageIds.size > 0) {
      const nodeBackendId = getNodeBackendId(node);
      passesPageSelection = selectedPageIds.has(nodeBackendId);
    }

    const passesMetrics = nodePassesMetricFilters(node);

    return !(passesPageSelection && passesMetrics);
  }, [selectedPageIds, filterMode, nodePassesMetricFilters]);

  const filteredGraphData = useMemo(() => {
    if (!graphData || !graphData.nodes) return graphData;

    const hasSelection = selectedPageIds && selectedPageIds.size > 0;
    const hasMetricFilters = metricRanges && metricBounds;

    if (!hasSelection && !hasMetricFilters) {
      return graphData;
    }

    let filteredNodes: INodeData[] = graphData.nodes;

    if (filterMode === 'remove') {
      filteredNodes = graphData.nodes.filter(node => !isNodeFiltered(node));
    }

    return {
      ...graphData,
      nodes: filteredNodes,
    };
  }, [graphData, selectedPageIds, filterMode, metricRanges, metricBounds, isNodeFiltered]);

  const containerClass = `flex flex-col flex-1 min-h-0 relative w-full ${isDark ?
    'bg-[#121317] text-[#e8e8e8]' :
    'bg-[#f5f5f5] text-[#333]'}`;

  if (loadingDepthNodes) {
    return (
      <div className={containerClass}>
        <div className='items-center flex text-base h-full justify-center opacity-70 w-full'>
          Loading LDA Topics data...
        </div>
      </div>
    );
  }

  if (!filteredGraphData || !filteredGraphData.nodes || filteredGraphData.nodes.length === 0) {
    return (
      <div className={containerClass}>
        <div className='items-center flex text-base h-full justify-center opacity-70 w-full'>
          No data available for LDA Topics analysis
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className='flex-1 relative'>
        {viewMode === 'ldavis' ? (
          <LDAvis
            data={filteredGraphData}
            settings={{
              theme,
              selectedPageIds,
              filterMode,
              isNodeFiltered,
            }}
          />
        ) : (
          <LDADiagram
            data={filteredGraphData}
            settings={{
              theme,
              numTopics: 8,
              showWatermark,
              watermarkLogoUrl,
              selectedPageIds,
              filterMode,
              isNodeFiltered,
            }}
          />
        )}
      </div>
    </div>
  );
});

export default LdaDiagram;
