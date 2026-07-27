import {useState, useMemo, useCallback, useEffect} from 'react';
import type {ITreeNode, IMetricRanges, IUseFilterDrawerDataParams, IUseFilterDrawerDataResult} from '../components/header/filter-drawer/types';
import {METRICS} from '../constants';
import {getAllNodeIds, getAllNodeIdsForExpand, convertGraphToTree, filterTreeBySearch, isGscMetric} from '../functions';

const DEFAULT_EXPAND_DEPTH = 1;


const useFilterDrawerData = ({
  depthNodes,
  depthNodesGraph,
  loadingDepthNodes,
  selectedIds,
  searchQuery,
  onMetricFiltersChange,
}: IUseFilterDrawerDataParams): IUseFilterDrawerDataResult => {
  const data = useMemo(() => {
    const graphNodes = (depthNodesGraph as {nodes?: unknown[]} | null)?.nodes as ITreeNode[] ?? [];
    const graphLinks = (depthNodesGraph as {links?: Array<{source: number | ITreeNode; target: number | ITreeNode}>} | null)?.links ?? [];

    if (loadingDepthNodes) {
      if (graphNodes.length > 0 && graphLinks.length > 0) {
        return convertGraphToTree(graphNodes, graphLinks);
      }
      return null;
    }

    const depthNodesTree = (depthNodes as unknown) as ITreeNode | null;
    if (depthNodesTree && depthNodesTree.children && depthNodesTree.children.length > 0) {
      return depthNodesTree;
    }
    if (graphNodes.length > 0 && graphLinks.length > 0) {
      return convertGraphToTree(graphNodes, graphLinks);
    }
    return depthNodesTree;
  }, [depthNodes, depthNodesGraph, loadingDepthNodes]);

  const nodes = useMemo(() => {
    return (depthNodesGraph as {nodes?: unknown[]} | null)?.nodes as ITreeNode[] ?? [];
  }, [depthNodesGraph]);

  const metricBounds = useMemo(() => {
    const bounds: {[key: string]: {min: number; max: number}} = {};
    METRICS.forEach(metric => {
      let min = Infinity;
      let max = -Infinity;
      let hasValidValues = false;
      nodes.forEach(node => {
        const value = node[metric.key] as number;
        if (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value)) {
          hasValidValues = true;
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
      if (!hasValidValues) {
        bounds[metric.key] = {min: 0, max: 0};
      } else if (min === max) {
        bounds[metric.key] = min === 0 ?
          {min: 0, max: 0} :
          {min: Math.max(0, min - 1), max: max + 1};
      } else {
        bounds[metric.key] = {min, max};
      }
    });
    return bounds;
  }, [nodes]);

  const [metricRanges, setMetricRanges] = useState<IMetricRanges>(() => {
    const initial: IMetricRanges = {};
    METRICS.forEach(metric => {
      const bounds = metricBounds[metric.key];
      if (isGscMetric(metric.key) && bounds && bounds.min === 0 && bounds.max === 0) {
        initial[metric.key] = {min: 0, max: 0};
      } else {
        initial[metric.key] = {
          min: bounds?.min ?? 0,
          max: bounds?.max ?? (isGscMetric(metric.key) ? 0 : 100),
        };
      }
    });
    return initial;
  });

  useEffect(() => {
    setMetricRanges(prevRanges => {
      const updated: IMetricRanges = {};
      let hasChanges = false;
      METRICS.forEach(metric => {
        const bounds = metricBounds[metric.key];
        const prevRange = prevRanges[metric.key];
        const defaultMax = isGscMetric(metric.key) ? (bounds?.max === 0 ? 0 : bounds?.max ?? 0) : (bounds?.max ?? 100);
        if (!prevRange ||
            prevRange.min !== (bounds?.min ?? 0) ||
            prevRange.max !== (bounds?.max ?? defaultMax)) {
          hasChanges = true;
          updated[metric.key] = {
            min: bounds?.min ?? 0,
            max: bounds?.max ?? defaultMax,
          };
        } else {
          updated[metric.key] = prevRange;
        }
      });
      return hasChanges ? updated : prevRanges;
    });
  }, [metricBounds]);

  const hasActiveMetricFilters = useMemo(() => {
    return METRICS.some(metric => {
      const bounds = metricBounds[metric.key];
      const range = metricRanges[metric.key];
      return range && bounds && (range.min > bounds.min || range.max < bounds.max);
    });
  }, [metricRanges, metricBounds]);

  const canResetFilters = useMemo(() => {
    return hasActiveMetricFilters || selectedIds.size > 0;
  }, [hasActiveMetricFilters, selectedIds.size]);

  const handleMetricRangeChange = useCallback((key: string, min: number, max: number) => {
    setMetricRanges(prev => {
      const updated = {...prev, [key]: {min, max}};
      if (onMetricFiltersChange) {
        onMetricFiltersChange(updated, metricBounds);
      }
      return updated;
    });
  }, [onMetricFiltersChange, metricBounds]);

  const handleResetMetricFilters = useCallback(() => {
    const reset: IMetricRanges = {};
    METRICS.forEach(metric => {
      const bounds = metricBounds[metric.key];
      reset[metric.key] = {min: bounds?.min ?? 0, max: bounds?.max ?? 0};
    });
    setMetricRanges(reset);
    if (onMetricFiltersChange) {
      onMetricFiltersChange(reset, metricBounds);
    }
  }, [metricBounds, onMetricFiltersChange]);

  const nodesPassingMetricFilters = useMemo(() => {
    const passingIds = new Set<number>();
    if (!nodes || nodes.length === 0) return passingIds;
    nodes.forEach(node => {
      let passes = true;
      for (const metric of METRICS) {
        const value = node[metric.key] as number | null | undefined;
        const range = metricRanges[metric.key];
        if (range && range.min === 0 && range.max === 0) continue;
        if (range) {
          // A missing/non-numeric value is "no data" for this metric, not "zero" — it
          // always passes rather than being coerced to 0 and possibly hidden by a range
          // filter that has nothing to do with whether the page was ever measured.
          if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
            continue;
          }
          if (value < range.min || value > range.max) {
            passes = false;
            break;
          }
        }
      }
      if (passes) passingIds.add(node.id);
    });
    return passingIds;
  }, [nodes, metricRanges]);

  const allNodeIds = useMemo(() => (data ? getAllNodeIds(data) : []), [data]);
  const allNodeIdsForExpand = useMemo(() => (data ? getAllNodeIdsForExpand(data) : []), [data]);
  const totalNodes = allNodeIds.length;

  const filteredData = useMemo(() => {
    if (!data || !searchQuery.trim()) return {data, hasMatches: true};
    const searchLower = searchQuery.toLowerCase();
    const filtered = filterTreeBySearch(data, searchLower);
    return {
      data: filtered || data,
      hasMatches: filtered !== null,
    };
  }, [data, searchQuery]);

  return {
    data,
    nodes,
    metricBounds,
    metricRanges,
    hasActiveMetricFilters,
    canResetFilters,
    nodesPassingMetricFilters,
    handleMetricRangeChange,
    handleResetMetricFilters,
    allNodeIds,
    allNodeIdsForExpand,
    totalNodes,
    filteredData,
  };
};

export {DEFAULT_EXPAND_DEPTH};
export default useFilterDrawerData;
