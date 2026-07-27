import {useEffect, useRef, useMemo, useState, useCallback} from 'react';
import {select, pointer} from 'd3-selection';
import {hierarchy, tree, HierarchyPointNode, HierarchyPointLink} from 'd3-hierarchy';
import {zoom, zoomIdentity, ZoomBehavior} from 'd3-zoom';
import {linkHorizontal} from 'd3-shape';
import type {ITreeNode, ICrawlTreeProps} from '../../types';
import {DEPTH_COLORS, METRICS} from '../../constants';
import {addSvgWatermark} from '../../functions';
import {countDescendants, filterTreeByDepth, getNodeBackendId, metricValuePassesRange} from '../../functions';
import {useTooltipPositioning} from '../../hooks/use-tooltip-positioning';

// Type for D3 hierarchy nodes with tree layout applied
type TreeNodeDatum = HierarchyPointNode<ITreeNode>;

export const useCrawlTree = ({
  data,
  theme = 'light',
  showPrunableIndicators = true,
  showWatermark = true,
  watermarkLogoUrl,
  selectedPageIds = new Set(),
  filterMode = 'deemphasize',
  hideOrphans = false,
  orphanNodeIds = new Set(),
  metricRanges,
  metricBounds,
}: ICrawlTreeProps) => {
  const hasSelection = selectedPageIds.size > 0;
  const isDark = theme === 'dark';

  const nodePassesMetricFilters = useCallback((node: ITreeNode) => {
    if (!metricRanges || !metricBounds) return true;

    for (const metric of METRICS) {
      const value = node[metric.key] as number | null | undefined;
      if (!metricValuePassesRange(value, metricRanges[metric.key], metricBounds[metric.key])) {
        return false;
      }
    }

    return true;
  }, [metricRanges, metricBounds]);

  const isNodeFiltered = useCallback((node: ITreeNode) => {
    if (filterMode !== 'deemphasize' && filterMode !== 'remove') return false;

    let passesPageSelection = true;
    if (hasSelection && selectedPageIds.size > 0) {
      const nodeBackendId = getNodeBackendId(node);
      passesPageSelection = selectedPageIds.has(nodeBackendId);
    }
    const passesMetrics = nodePassesMetricFilters(node);

    return !(passesPageSelection && passesMetrics);
  }, [hasSelection, selectedPageIds, filterMode, nodePassesMetricFilters]);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({width: 0, height: 0});
  const [isReady, setIsReady] = useState(false);
  const [selectedMaxDepth, setSelectedMaxDepth] = useState<number>(3);
  const [tooltip, setTooltip] = useState<{ node: ITreeNode; x: number; y: number } | null>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Theme colors used by D3 rendering
  const colors = useMemo(() => ({
    text: isDark ? '#E8E8E8' : '#333333',
    textSecondary: isDark ? '#A3A4A4' : '#666666',
    lineColor: isDark ? '#4E5156' : '#cccccc',
    nodeStroke: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
  }), [isDark]);

  const filterOrphansFromTree = useCallback((node: ITreeNode, orphanNodeIds: Set<number>): ITreeNode | null => {
    if (hideOrphans && orphanNodeIds.has(node.id)) {
      return null;
    }

    if (node.children && node.children.length > 0) {
      const filteredChildren = node.children
        .map(child => filterOrphansFromTree(child, orphanNodeIds))
        .filter((child): child is ITreeNode => child !== null);

      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      };
    }

    return node;
  }, [hideOrphans]);

  // Filter data by selected depth and orphans
  const filteredData = useMemo(() => {
    let result = data;
    if (hideOrphans) {
      const filtered = filterOrphansFromTree(data, orphanNodeIds);
      result = filtered || data;
    }
    return filterTreeByDepth(result, selectedMaxDepth) || result;
  }, [data, selectedMaxDepth, hideOrphans, filterOrphansFromTree, orphanNodeIds]);

  // Count visible nodes
  const visibleNodes = useMemo(() => countDescendants(filteredData), [filteredData]);

  const depthLevels = useMemo(() => {
    return [0, 1, 2, 3];
  }, []);

  // Handle resize - measure container on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const {width, height} = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({width, height: Math.max(height, 500)});
          setIsReady(true);
        } else {
          setIsReady(false);
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      updateDimensions();
    });

    const retryInterval = setInterval(() => {
      if (!isReady && containerRef.current) {
        updateDimensions();
      }
    }, 100);

    window.addEventListener('resize', updateDimensions);
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(retryInterval);
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isReady]);

  // Reset zoom function - start from top-left
  const resetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = select(svgRef.current);
      svg.transition().duration(750).call(
        zoomRef.current.transform,
        zoomIdentity.translate(40, 40).scale(0.6),
      );
    }
  }, []);

  // Main D3 rendering
  useEffect(() => {
    if (!svgRef.current || !filteredData || !isReady || dimensions.width === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const {width, height} = dimensions;

    // Add watermark
    if (showWatermark) {
      addSvgWatermark(svg, width, height, theme, watermarkLogoUrl);
    }

    // Calculate node spacing based on tree size (horizontal left-to-right layout)
    const nodeVerticalSpacing = 22; // Pixels per leaf node (vertical spread)
    const nodeHorizontalSpacing = 200; // Pixels between depth levels (horizontal)

    // Create hierarchy
    const root = hierarchy(filteredData);

    // Count leaves to calculate tree height
    const leafCount = root.leaves().length;
    const treeHeight = Math.max(height - 100, leafCount * nodeVerticalSpacing);
    const treeWidth = (selectedMaxDepth + 1) * nodeHorizontalSpacing;

    // Create tree layout - horizontal left-to-right, starting from top
    const treeLayout = tree<ITreeNode>()
      .size([treeHeight, treeWidth])
      .separation((a, b) => {
        // Custom separation: more space for nodes with many descendants
        const aLeaves = a.leaves().length;
        const bLeaves = b.leaves().length;
        return (a.parent === b.parent ? 1 : 1.5) * Math.max(1, (aLeaves + bLeaves) / 20);
      });

    // Apply layout - returns the root with x/y coordinates
    const layoutRoot = treeLayout(root) as TreeNodeDatum;

    // Create container group for zoom/pan
    const g = svg.append('g')
      .attr('class', 'tree-container');

    // Setup zoom behavior
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', event => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    // Initial transform - start from top-left, tree expands right and down
    const initialScale = 0.6;
    const initialTransform = zoomIdentity
      .translate(40, 40)
      .scale(initialScale);

    svg.call(zoomBehavior.transform, initialTransform);

    // Create curved link generator (horizontal - left to right)
    const linkGenerator = linkHorizontal<HierarchyPointLink<ITreeNode>, HierarchyPointNode<ITreeNode>>()
      .x(d => d.y)
      .y(d => d.x);

    // Draw links
    g.selectAll('.link')
      .data(layoutRoot.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', colors.lineColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', d => {
        // Apply filter to links
        const isTargetFiltered = hasSelection && !selectedPageIds.has(d.target.data.id);
        const isSourceFiltered = hasSelection && !selectedPageIds.has(d.source.data.id);
        if ((isTargetFiltered || isSourceFiltered) && filterMode === 'deemphasize') return 0.1;
        if ((isTargetFiltered || isSourceFiltered) && filterMode === 'remove') return 0;
        return 0.6;
      });

    // Create node groups (y is horizontal position, x is vertical for left-to-right tree)
    const nodes = g.selectAll('.node')
      .data(layoutRoot.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .style('opacity', d => {
        const isFiltered = isNodeFiltered(d.data);
        if (isFiltered && filterMode === 'deemphasize') return 0.2;
        if (isFiltered && filterMode === 'remove') return 0;
        return 1;
      })
      .style('pointer-events', d => {
        // Disable pointer events for removed nodes
        const isFiltered = isNodeFiltered(d.data);
        if (isFiltered && filterMode === 'remove') return 'none';
        return 'all';
      });

    // Draw node circles
    nodes.append('circle')
      .attr('r', 6)
      .attr('fill', d => DEPTH_COLORS[d.data.depth as keyof typeof DEPTH_COLORS] || '#667085')
      .attr('stroke', d => {
        const isPrunable = d.data.isPrunable === true;
        const isOrphan = orphanNodeIds.has(d.data.id);
        if (!hideOrphans && isOrphan) return '#FF9800';
        if (showPrunableIndicators && isPrunable) return '#E74C3C';
        return colors.nodeStroke;
      })
      .attr('stroke-width', d => {
        const isPrunable = d.data.isPrunable === true;
        const isOrphan = orphanNodeIds.has(d.data.id);
        if (!hideOrphans && isOrphan) return 3;
        if (showPrunableIndicators && isPrunable) return 3;
        return 1.5;
      });

    // Draw labels (positioned to the right of leaf nodes, left of parent nodes)
    nodes.append('text')
      .attr('x', d => d.children ? -10 : 10)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .attr('font-size', '11px')
      .attr('fill', colors.text)
      .text(d => {
        const name = d.data.url?.replace(/^https?:\/\/[^/]+/, '') || d.data.name || '/';
        return name.length > 30 ? name.slice(0, 30) + '...' : name;
      });

    // Add child count badges for nodes with children
    nodes.filter(d => !!(d.children && d.children.length > 0))
      .append('text')
      .attr('x', 12)
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('fill', colors.textSecondary)
      .text(d => d.children ? `(${d.children.length})` : '');

    // Hover and click events
    nodes
      .on('mouseenter', (event, d) => {
        // Highlight node
        const target = event.currentTarget as SVGGElement;
        select(target).select('circle')
          .transition()
          .duration(150)
          .attr('r', 9)
          .attr('stroke-width', 2.5);

        // Show tooltip
        const [x, y] = pointer(event, containerRef.current);
        setTooltip({node: d.data, x, y});
      })
      .on('mouseleave', (event, d) => {
        // Reset node
        const target = event.currentTarget as SVGGElement;
        select(target).select('circle')
          .transition()
          .duration(150)
          .attr('r', 6)
          .attr('stroke-width', showPrunableIndicators && d.data.isPrunable ? 3 : 1.5);

        setTooltip(null);
      })
      .on('click', (event, d) => {
        // Open URL in new tab
        if (d.data.url) {
          window.open(d.data.url, '_blank');
        }
      });
  }, [filteredData, dimensions, colors, selectedMaxDepth, showPrunableIndicators, isReady, showWatermark, theme, watermarkLogoUrl, filterMode, hasSelection, selectedPageIds, isNodeFiltered]);

  // Use tooltip positioning hook to prevent viewport overflow
  useTooltipPositioning();

  return {
    svgRef,
    containerRef,
    dimensions,
    isReady,
    isDark,
    tooltip,
    selectedMaxDepth,
    setSelectedMaxDepth,
    visibleNodes,
    depthLevels,
    resetZoom,
  };
};
