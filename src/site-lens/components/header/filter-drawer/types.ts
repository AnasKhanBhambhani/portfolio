import type {ITreeNode, TTheme, IMetricRanges} from '../../../types';
import type {IDepthNode, IDepthNodesGraph} from '@/modules/site-audit/v1/api.types';
export type {ITreeNode, TTheme, IMetricRanges};
export type FilterMode = 'deemphasize' | 'remove';

export interface IInfoIconProps {
  theme: TTheme;
  title: string;
  colorClass?: string;
}
export interface IMetricSliderProps {
  label: string;
  tooltip: string;
  dataMin: number;
  dataMax: number;
  currentMin: number;
  currentMax: number;
  onChange: (min: number, max: number) => void;
  format: (value: number) => string;
  theme: TTheme;
}
export interface ITreeNodeItemProps {
  node: ITreeNode;
  selectedIds: Set<number>;
  onToggleNode: (node: ITreeNode, selected: boolean) => void;
  onToggleSubtree: (node: ITreeNode, selected: boolean) => void;
  expandedNodes: Set<number>;
  onToggleExpand: (nodeId: number) => void;
  theme: TTheme;
  defaultExpandDepth: number;
  collapsedNodes?: Set<number>;
  disableEllipsis?: boolean;
}
export interface IPageSelectorProps {
  theme: TTheme;
  isOpen?: boolean;
  onToggle: () => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  onMetricFiltersChange?: (ranges: IMetricRanges, bounds: {[key: string]: {min: number; max: number}}) => void;
}
export interface IUseFilterDrawerDataParams {
  depthNodes: IDepthNode | null | undefined;
  depthNodesGraph: IDepthNodesGraph | null | undefined;
  loadingDepthNodes: boolean | null;
  selectedIds: Set<number>;
  searchQuery: string;
  onMetricFiltersChange?: (ranges: IMetricRanges, bounds: {[key: string]: {min: number; max: number}}) => void;
}
export interface IUseFilterDrawerDataResult {
  data: ITreeNode | null;
  nodes: ITreeNode[];
  metricBounds: {[key: string]: {min: number; max: number}};
  metricRanges: IMetricRanges;
  hasActiveMetricFilters: boolean;
  canResetFilters: boolean;
  nodesPassingMetricFilters: Set<number>;
  handleMetricRangeChange: (key: string, min: number, max: number) => void;
  handleResetMetricFilters: () => void;
  allNodeIds: number[];
  allNodeIdsForExpand: number[];
  totalNodes: number;
  filteredData: {data: ITreeNode | null; hasMatches: boolean};
}
export interface IUseTreeStateParams {
  data: ITreeNode | null;
  defaultExpandDepth: number;
  allNodeIdsForExpand: number[];
  allNodeIds: number[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  depthNodes: IDepthNode | null | undefined;
  depthNodesGraph: IDepthNodesGraph | null | undefined;
}
export interface IUseTreeStateResult {
  expandedNodes: Set<number>;
  collapsedNodes: Set<number>;
  handleToggleExpand: (nodeId: number) => void;
  handleToggleNode: (node: ITreeNode, selected: boolean) => void;
  handleToggleSubtree: (node: ITreeNode, selected: boolean) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleInvertSelection: () => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;
}
