
import type {Selection} from 'd3-selection';
import type {TTheme, ITreeNode, FilterMode, INodeData, Topic, TermData} from './types';
import {
  HEALTH_COLORS,
  CLUSTER_COLORS,
  STOP_WORDS,
  METRICS,
  LARGE_GRAPH_NODE_THRESHOLD,
  DEFAULT_MAX_DEPTH_LARGE_GRAPH,
  DEFAULT_MAX_DEPTH_SMALL_GRAPH,
} from './constants';

// =============================================================================
// COLOR UTILITIES
// =============================================================================

export const getHealthColor = (health: number): string => {
  if (health >= 75) return HEALTH_COLORS.good;
  if (health >= 50) return HEALTH_COLORS.warning;
  return HEALTH_COLORS.bad;
};

export const getThemeColors = (theme: TTheme) => {
  switch (theme) {
    case 'light':
      return {
        bg: '#f5f5f5',
        text: '#1a1a1a',
        textMuted: '#666666',
        lineColor: '#999999',
        tooltipBg: '#ffffff',
        tooltipBorder: 'rgba(0, 0, 0, 0.2)',
        tooltipText: '#1a1a1a',
      };
    case 'dark':
    default:
      return {
        bg: '#000000',
        text: '#ffffff',
        textMuted: '#CCCCCC',
        lineColor: '#4E5156',
        tooltipBg: '#000000',
        tooltipBorder: 'rgba(255, 255, 255, 0.5)',
        tooltipText: '#ffffff',
      };
  }
};

export const getVisualizationThemeColors = (theme: TTheme) => ({
  background: theme === 'light' ? '#f5f5f5' : '#000000',
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
  cardBg: theme === 'light' ? '#ffffff' : '#1a1b1f',
  border: theme === 'light' ? '#e0e0e0' : '#4E5156',
});

// =============================================================================
// TREE UTILITIES
// =============================================================================

export const countDescendants = (node: ITreeNode): number => {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + node.children.reduce((sum, child) => sum + countDescendants(child), 0);
};

export const countNodes = (node: ITreeNode): number => {
  return countDescendants(node);
};

export const filterTreeByDepth = (
  node: ITreeNode,
  maxDepth: number,
  currentDepth = 0,
): ITreeNode | null => {
  if (currentDepth > maxDepth) return null;

  const filteredNode: ITreeNode = {
    ...node,
    children: [],
  };

  if (node.children && currentDepth < maxDepth) {
    filteredNode.children = node.children
      .map(child => filterTreeByDepth(child, maxDepth, currentDepth + 1))
      .filter((child): child is ITreeNode => child !== null);
  }

  return filteredNode;
};

export const getMaxDepth = (node: ITreeNode, current = 0): number => {
  if (!node.children || node.children.length === 0) return current;
  return Math.max(...node.children.map(child => getMaxDepth(child, current + 1)));
};

/**
 * Resolves the id used to match a node against backend page-selection ids.
 * `urlId` is not a field the Site Lens API currently sends (verified against
 * IDepthNode in api.types.ts) — this always falls back to `node.id` today.
 * Kept as a single named helper (instead of `node.urlId ?? node.id` repeated
 * at every call site) so if the backend ever adds a real `urlId`, there is
 * one place to stop falling back.
 * @param {ITreeNode} node - a graph/tree node
 * @return {number} the id to use for backend-facing selection matching
 */
export const getNodeBackendId = (node: ITreeNode): number => node.urlId ?? node.id;

export const getAllNodeIds = (node: ITreeNode): number[] => {
  // Iterative DFS to avoid stack overflow and spread-argument limit on large trees
  const ids: number[] = [];
  const stack: ITreeNode[] = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    ids.push(getNodeBackendId(current));
    if (current.children) {
      for (const child of current.children) stack.push(child);
    }
  }
  return ids;
};

export const getAllNodeIdsForExpand = (node: ITreeNode): number[] => {
  const ids: number[] = [];
  const stack: ITreeNode[] = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    ids.push(current.id);
    if (current.children) {
      for (const child of current.children) stack.push(child);
    }
  }
  return ids;
};

export const findNode = (root: ITreeNode, id: number): ITreeNode | null => {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

export const convertGraphToTree = (
  nodes: ITreeNode[],
  links: Array<{source: number | ITreeNode; target: number | ITreeNode}>,
): ITreeNode | null => {
  if (!nodes || nodes.length === 0) return null;

  const nodeMap = new Map<number, ITreeNode>();
  nodes.forEach(node => {
    nodeMap.set(node.id, {...node, children: []});
  });

  const rootNode = nodes.find(node => node.depth === 0) || nodes[0];
  if (!rootNode) return null;

  const addedAsChild = new Set<number>();

  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;

    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);

    if (sourceNode && targetNode) {
      if (!sourceNode.children) {
        sourceNode.children = [];
      }
      if (!addedAsChild.has(targetId)) {
        sourceNode.children.push(targetNode);
        addedAsChild.add(targetId);
      }
    }
  });

  return nodeMap.get(rootNode.id) || null;
};

/**
 * Whether a node's raw metric value falls within an active [range.min, range.max] filter.
 * A missing/non-numeric value means "no data" for that metric, not "zero" — it always
 * passes rather than being coerced to 0, so a page that was never measured isn't silently
 * hidden by an unrelated range filter (which would conflate "no data" with "confirmed zero").
 * @param {number | null | undefined} value - raw metric value read off the node
 * @param {object} [range] - the active user-set [min, max] for this metric
 * @param {object} [bounds] - the full [min, max] of the metric across all nodes
 * @return {boolean} true if the node should remain visible under this metric's filter
 */
export const metricValuePassesRange = (
  value: number | null | undefined,
  range?: {min: number; max: number},
  bounds?: {min: number; max: number},
): boolean => {
  if (!range || !bounds) return true;
  const isNarrowed = range.min > bounds.min || range.max < bounds.max;
  if (!isNarrowed) return true;
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return true;
  }
  return value >= range.min && value <= range.max;
};

export const applyFilterToTreeNodes = (
  node: any,
  selectedIds: Set<number>,
  filterMode: FilterMode,
  hasSelection: boolean,
  orphanNodeIds?: Set<number>,
  hideOrphans?: boolean,
  metricRanges?: {[key: string]: {min: number; max: number}},
  metricBounds?: {[key: string]: {min: number; max: number}},
): any => {
  if (!node) return node;
  if (hideOrphans && orphanNodeIds && orphanNodeIds.has(node.id)) {
    return null;
  }

  let passesPageSelection = true;
  if (hasSelection && selectedIds.size > 0) {
    const nodeBackendId = getNodeBackendId(node);
    passesPageSelection = selectedIds.has(nodeBackendId);
  }

  let passesMetrics = true;
  if (metricRanges && metricBounds) {
    for (const metric of METRICS) {
      const value = node[metric.key] as number | null | undefined;
      if (!metricValuePassesRange(value, metricRanges[metric.key], metricBounds[metric.key])) {
        passesMetrics = false;
        break;
      }
    }
  }

  const isFiltered = !(passesPageSelection && passesMetrics);

  const filteredNode = {
    ...node,
    itemStyle: {
      ...node.itemStyle,
      opacity: isFiltered && filterMode === 'deemphasize' ? 0.2 : 1,
    },
    ...(isFiltered && filterMode === 'remove' ? {symbolSize: 0, label: {show: false}} : {}),
  };

  if (node.children && node.children.length > 0) {
    const filteredChildren = node.children
      .map((child: any) => applyFilterToTreeNodes(child, selectedIds, filterMode, hasSelection, orphanNodeIds, hideOrphans, metricRanges, metricBounds))
      .filter((child: any) => child !== null);
    filteredNode.children = filteredChildren.length > 0 ? filteredChildren : undefined;
  }

  return filteredNode;
};

export const getShortName = (url: string, nodeName?: string): string => {
  if (nodeName && nodeName.trim()) {
    return nodeName;
  }

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.replace(/\/$/, '');
    if (!path || path === '') {
      const hostname = urlObj.hostname.replace(/^www\./, '');
      return hostname.toUpperCase();
    }
    const parts = path.split('/').filter(Boolean);
    const name = parts[parts.length - 1] || urlObj.hostname.replace(/^www\./, '').toUpperCase();
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    return url || 'Homepage';
  }
};

export const filterTreeBySearch = (node: ITreeNode, searchLower: string): ITreeNode | null => {
  const nameMatch = getShortName(node.url).toLowerCase().includes(searchLower);
  const urlMatch = node.url.toLowerCase().includes(searchLower);
  const filteredChildren = node.children
    ?.map(child => filterTreeBySearch(child, searchLower))
    .filter((n): n is ITreeNode => n !== null) || [];
  if (nameMatch || urlMatch || filteredChildren.length > 0) {
    return {...node, children: filteredChildren};
  }
  return null;
};

export const isGscMetric = (metricKey: string): boolean =>
  metricKey === 'traffic' || metricKey === 'impressions' || metricKey === 'keywords';

export const getDepthClass = (depth: number): string => {
  const depthMap: Record<number, string> = {
    0: 'depth0',
    1: 'depth1',
    2: 'depth2',
    3: 'depth3',
    4: 'depth4',
    5: 'depth5',
  };
  return depthMap[depth] || 'depth5';
};

export const generateDepthLevels = (maxDepth: number): number[] => {
  const levels = [];
  for (let i = 0; i <= maxDepth; i++) {
    levels.push(i);
  }
  return levels;
};

export const getDefaultMaxDepthForGraph = (totalNodeCount: number): number => {
  if (totalNodeCount > LARGE_GRAPH_NODE_THRESHOLD) {
    return DEFAULT_MAX_DEPTH_LARGE_GRAPH;
  }
  return DEFAULT_MAX_DEPTH_SMALL_GRAPH;
};

// Per-graph link length (the ringUnit driving 2D/3D spacing and the 2D force distance). Now computed
// automatically from graph size instead of a manual slider: a fixed 115 left dense/deep crawls
// cramped and tiny ones over-sparse. The dominant crowding factor is how many nodes share a ring
// (~totalNodes / depth), so grow sub-linearly with that density plus a mild depth term. Tuned so a
// typical medium graph (~100 nodes, depth 3) lands near the old 115, clamped to a sane [40, 200].
export const getDynamicLinkLength = (totalNodeCount: number, maxDepth: number | null): number => {
  const depth = Math.max(1, maxDepth ?? 3);
  const nodesPerLevel = Math.max(1, totalNodeCount) / depth;
  const value = 50 + 8.5 * Math.sqrt(nodesPerLevel) + 5 * depth;
  return Math.round(Math.min(200, Math.max(40, value)));
};

// =============================================================================
// LDA / TOPIC UTILITIES
// =============================================================================

export const getClusterColor = (topicId: number) => {
  const index = Math.max(0, (topicId - 1) % CLUSTER_COLORS.length);
  return CLUSTER_COLORS[index] || CLUSTER_COLORS[0];
};


export function extractTopicsWithTerms(nodes: INodeData[], numTopics: number = 6): Topic[] {
  const topicGroups: Map<string, INodeData[]> = new Map();
  const globalTermFreq: Map<string, number> = new Map();

  nodes.forEach(node => {
    try {
      const url = new URL(node.url);
      const pathParts = url.pathname.split('/').filter(p => p);
      let topicKey = pathParts[0] || 'homepage';

      if (topicKey === 'homepage' || pathParts.length === 0) {
        const hostname = url.hostname.replace(/^www\./, '');
        topicKey = hostname.toUpperCase();
      }

      if (!topicGroups.has(topicKey)) {
        topicGroups.set(topicKey, []);
      }
      topicGroups.get(topicKey)!.push(node);

      const text = `${node.name} ${node.h1Header || ''} ${node.h2Header || ''} ${pathParts.join(' ')}`.toLowerCase();
      const words = text.split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.includes(w));
      words.forEach(w => globalTermFreq.set(w, (globalTermFreq.get(w) || 0) + 1));
    } catch {
      if (!topicGroups.has('other')) {
        topicGroups.set('other', []);
      }
      topicGroups.get('other')!.push(node);
    }
  });

  const totalNodes = nodes.length;

  const sortedTopics = Array.from(topicGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, numTopics);

  return sortedTopics.map(([key, topicNodes], index) => {
    const topicTermFreq: Map<string, number> = new Map();
    topicNodes.forEach(node => {
      try {
        const url = new URL(node.url);
        const pathParts = url.pathname.split('/').filter(p => p);
        const text = `${node.name} ${node.h1Header || ''} ${node.h2Header || ''} ${pathParts.join(' ')}`.toLowerCase();
        const words = text.split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.includes(w));
        words.forEach(w => topicTermFreq.set(w, (topicTermFreq.get(w) || 0) + 1));
      } catch (error) {
        console.error('Skip malformed URLs:', error);
      }
    });

    const terms: TermData[] = Array.from(topicTermFreq.entries())
      .map(([term, freq]) => ({
        term,
        topicFreq: freq,
        corpusFreq: globalTermFreq.get(term) || freq,
      }))
      .sort((a, b) => b.topicFreq - a.topicFreq)
      .slice(0, 50);

    let topicName = key;
    if (key.includes('.') && key === key.toUpperCase()) {
      topicName = key;
    } else if ((key === 'homepage' || key.includes('.')) && topicNodes.length > 0) {
      const firstNode = topicNodes[0];
      if (firstNode.name && firstNode.name.trim()) {
        topicName = firstNode.name;
      } else {
        try {
          const url = new URL(firstNode.url);
          const hostname = url.hostname.replace(/^www\./, '');
          topicName = hostname.toUpperCase();
        } catch {
          topicName = key;
        }
      }
    } else {
      topicName = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
    }

    return {
      id: index + 1,
      name: topicName,
      terms,
      nodes: topicNodes,
      weight: topicNodes.length / totalNodes,
    };
  });
}

export function calculateRelevance(term: TermData, lambda: number, maxTopicFreq: number, maxCorpusFreq: number): number {
  const normTopicFreq = term.topicFreq / maxTopicFreq;
  const normCorpusFreq = term.corpusFreq / maxCorpusFreq;
  return lambda * normTopicFreq + (1 - lambda) * (normTopicFreq / (normCorpusFreq + 0.01));
}

export function positionTopics(topics: Topic[], width: number, height: number): Topic[] {
  const n = topics.length;
  const similarity: number[][] = [];

  for (let i = 0; i < n; i++) {
    similarity[i] = [];
    const termsI = new Set(topics[i].terms?.map(t => t.term) || []);
    for (let j = 0; j < n; j++) {
      if (i === j) {
        similarity[i][j] = 1;
      } else {
        const termsJ = new Set(topics[j].terms?.map(t => t.term) || []);
        const termsIArray = Array.from(termsI);
        const termsJArray = Array.from(termsJ);
        const intersection = termsIArray.filter(t => termsJ.has(t)).length;
        const union = new Set([...termsIArray, ...termsJArray]).size;
        similarity[i][j] = union > 0 ? intersection / union : 0;
      }
    }
  }

  const positioned = topics.map((topic, i) => {
    const angle = (2 * Math.PI * i) / n;
    const radius = Math.min(width, height) * 0.3;
    return {
      ...topic,
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
    };
  });

  for (let iter = 0; iter < 50; iter++) {
    for (let i = 0; i < n; i++) {
      let fx = 0; let fy = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const dx = positioned[j].x! - positioned[i].x!;
          const dy = positioned[j].y! - positioned[i].y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = (1 - similarity[i][j]) * Math.min(width, height) * 0.4 + 50;
          const force = (dist - targetDist) * 0.02;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }
      positioned[i].x = Math.max(80, Math.min(width - 80, positioned[i].x! + fx));
      positioned[i].y = Math.max(80, Math.min(height - 80, positioned[i].y! + fy));
    }
  }

  return positioned;
}

// =============================================================================
// WATERMARK UTILITIES
// =============================================================================

export const WATERMARK_CONFIG = {
  opacity: 0.153,
  sizeRatio: 0.084,
  logoPathDark: '/icons/searchatlas-logo-watermark.svg',
  logoPathLight: '/icons/searchatlas-logo-watermark-light.svg',
  aspectRatio: 713 / 55,
  getLogoPath: (theme: TTheme, logoUrl?: string | null): string => {
    if (logoUrl) return logoUrl;
    return theme === 'light' ? WATERMARK_CONFIG.logoPathLight : WATERMARK_CONFIG.logoPathDark;
  },
};

export function addSvgWatermark(
  svg: Selection<any, unknown, null, undefined>,
  width: number,
  height: number,
  theme: TTheme = 'dark',
  logoUrl?: string | null,
): Selection<SVGImageElement, unknown, null, undefined> | null {
  if (width < 100 || height < 100) return null;

  const {opacity, sizeRatio, aspectRatio, getLogoPath} = WATERMARK_CONFIG;
  const logoPath = getLogoPath(theme, logoUrl);

  const watermarkHeight = Math.min(width, height) * sizeRatio;
  const watermarkWidth = watermarkHeight * aspectRatio;

  const watermark = svg.append('image')
    .attr('class', 'searchatlas-watermark')
    .attr('href', logoPath)
    .attr('x', (width - watermarkWidth) / 2)
    .attr('y', (height - watermarkHeight) / 2)
    .attr('width', watermarkWidth)
    .attr('height', watermarkHeight)
    .attr('opacity', opacity)
    .attr('pointer-events', 'none');

  watermark.lower();

  return watermark;
}


export function getEChartsWatermarkGraphic(
  containerWidth: number,
  containerHeight: number,
  theme: TTheme = 'dark',
  logoUrl?: string | null,
) {
  if (containerWidth < 100 || containerHeight < 100) {
    return {type: 'group', children: []};
  }

  const {opacity, sizeRatio, aspectRatio, getLogoPath} = WATERMARK_CONFIG;
  const logoPath = getLogoPath(theme, logoUrl);

  const watermarkHeight = Math.min(containerWidth, containerHeight) * sizeRatio;
  const watermarkWidth = watermarkHeight * aspectRatio;

  return {
    type: 'image',
    left: 'center',
    top: 'middle',
    z: -10,
    style: {
      image: logoPath,
      width: watermarkWidth,
      height: watermarkHeight,
      opacity: opacity,
    },
    silent: true,
  };
}

