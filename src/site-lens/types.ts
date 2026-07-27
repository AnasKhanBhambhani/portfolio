/**
 * Consolidated types for SiteVisualization components
 */

// =============================================================================
// THEME TYPES
// =============================================================================

export type TTheme = 'light' | 'dark';
export type FilterMode = 'deemphasize' | 'remove';

// =============================================================================
// NODE & GRAPH DATA STRUCTURES
// =============================================================================

export interface INodeData {
    id: number;
    url: string;
    name: string;
    h1Header?: string | null;
    h2Header?: string | null;
    traffic?: number;
  pageHealth?: number;
  depth: number;
    impressions?: number;
    keywords?: number;
  wordCount?: number;
  pagerank?: number;
  issueCount?: number;
    urlId?: number;
    symbolSize?: number;
    category?: number;
    itemStyle?: { color: string };
    status?: 'Indexable' | 'Not Indexable' | string;
    isPrunable?: boolean;
    isOrphan?: boolean;
    paidTraffic?: number;
    bounceRate?: number;
    dwellTime?: number;
    conversions?: number;
    conversionValue?: number;
    lastUpdated?: string;
  [key: string]: unknown;
}

export interface ITreeNode extends INodeData {
    children?: ITreeNode[];
  }

export interface ILinkData {
  source: number;
  target: number;
}

export interface ICategory {
  name: string;
}

export interface IGraphData {
  nodes: INodeData[];
  links?: ILinkData[];
  categories?: ICategory[];
}

// =============================================================================
// LDA-SPECIFIC TYPES
// =============================================================================

export interface KeywordWithWeight {
  word: string;
  weight: number;
}

export interface Topic {
  id: number;
  name: string;
  keywords?: string[];
  keywordWeights?: KeywordWithWeight[];
  color?: string;
  nodes: INodeData[];
  weight: number;
  terms?: TermData[];
  x?: number;
  y?: number;
}

export interface TermData {
  term: string;
  topicFreq: number;
  corpusFreq: number;
  relevance?: number;
}

export interface CloudWord {
  text: string;
  size: number;
  weight: number;
  x?: number;
  y?: number;
  rotate?: number;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface ICrawlTreeProps {
    data: ITreeNode;
  theme?: TTheme;
    showPrunableIndicators?: boolean;
  showWatermark?: boolean;
  watermarkLogoUrl?: string | null;
  selectedPageIds?: Set<number>;
  filterMode?: FilterMode;
  hideOrphans?: boolean;
  orphanNodeIds?: Set<number>;
  metricRanges?: IMetricRanges;
  metricBounds?: {[key: string]: {min: number; max: number}};
}

export interface ITreeDiagramProps {
  theme: TTheme;
  showWatermark?: boolean;
  watermarkLogoUrl?: string | null;
  selectedPageIds?: Set<number>;
  filterMode?: FilterMode;
  showPrunable?: boolean;
  hideOrphans?: boolean;
  orphanNodeIds?: Set<number>;
  metricRanges?: IMetricRanges;
  metricBounds?: {[key: string]: {min: number; max: number}};
}

export interface ILdaDiagramProps {
  theme: TTheme;
  showWatermark?: boolean;
  /** Whitelabel logo URL for watermark; when set, overrides default Search Atlas watermark */
  watermarkLogoUrl?: string | null;
  viewMode?: 'bubbles' | 'ldavis';
  selectedPageIds?: Set<number>;
  filterMode?: FilterMode;
  metricRanges?: IMetricRanges;
  metricBounds?: {[key: string]: {min: number; max: number}};
}

export interface IThreeDCrawlDiagramProps {
  type: number;
  theme: TTheme;
  rootStore?: unknown;
  showWatermark: boolean;
  watermarkLogoUrl?: string | null;
  selectedPageIds?: Set<number>;
  filterMode?: FilterMode;
  showPrunable?: boolean;
  hideOrphans?: boolean;
  metricRanges?: IMetricRanges;
  metricBounds?: {[key: string]: {min: number; max: number}};
}

export interface IGraphProps {
  type: number;
  theme: TTheme;
  showWatermark: boolean;
  watermarkLogoUrl?: string | null;
  selectedPageIds?: Set<number>;
  filterMode?: FilterMode;
  showPrunable?: boolean;
  hideOrphans?: boolean;
  metricRanges?: IMetricRanges;
  metricBounds?: {[key: string]: {min: number; max: number}};
}

export interface LDADiagramProps {
  data: IGraphData;
  settings: {
    theme: TTheme;
    numTopics?: number;
    showWatermark?: boolean;
    watermarkLogoUrl?: string | null;
    selectedPageIds?: Set<number>;
    filterMode?: FilterMode;
    isNodeFiltered?: (node: INodeData) => boolean;
  };
  }

export interface LDAvisProps {
  data: IGraphData;
  settings: {
    theme: TTheme;
    selectedPageIds?: Set<number>;
    filterMode?: FilterMode;
    isNodeFiltered?: (node: INodeData) => boolean;
  };
}

export interface WordCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic | null;
  theme: TTheme;
  watermarkLogoUrl?: string | null;
}

export interface IChordDiagramProps {
  theme: TTheme;
  showWatermark?: boolean;
  watermarkLogoUrl?: string | null;
  selectedPageIds?: Set<number>;
  filterMode?: FilterMode;
  showPrunable?: boolean;
  nodes: ITreeNode[];
  links: ILinkData[];
  metricRanges?: IMetricRanges;
  metricBounds?: {[key: string]: {min: number; max: number}};
}

export interface IPageSelectorProps {
  theme: TTheme;
  isOpen: boolean;
  onToggle: () => void;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  onMetricFiltersChange?: (ranges: IMetricRanges, bounds: {[key: string]: {min: number; max: number}}) => void;
}

// =============================================================================
// VISUALIZATION INFO TYPES
// =============================================================================

export interface IVisualizationInfo {
  title: string;
  description: string;
  whatItShows: string[];
  howToUse: string[];
  howCalculated: string[];
  keyInsights: string[];
}

// =============================================================================
// CHORD DIAGRAM TYPES
// =============================================================================

export interface ISectionData {
  name: string;
  nodeIds: Set<number>;
  nodes: ITreeNode[];
  color: string;
  totalTraffic: number;
  totalLinks: number;
}

export interface ISelection {
  type: 'group' | 'ribbon';
  groupIndex?: number;
  sourceIndex?: number;
  targetIndex?: number;
}

export interface ILinkDetail {
  sourceUrl: string;
  targetUrl: string;
}

// =============================================================================
// FILTER DRAWER TYPES
// =============================================================================

export interface IMetricConfig {
  key: string;
  label: string;
  tooltip: string;
  format: (value: number) => string;
}

export interface IMetricRange {
  min: number;
  max: number;
}

export interface IMetricRanges {
  [key: string]: IMetricRange;
}

export interface IInfoTooltipProps {
  text: string;
  theme: TTheme;
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
}
