
import React, {useState, useMemo, useCallback} from 'react';
import ReactECharts from 'echarts-for-react';
import {observer} from 'mobx-react';
import {renderToString} from 'react-dom/server';
import {EmptyState} from '@/shared/ui/composed/empty-state';
import {ChevronDownIcon} from 'lucide-react';
import {DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from '@/shared/ui/dropdown-menu';
import {getProgressColor} from '@/utils/colors';
import {Checkbox} from '@/components/common-components/components/form/checkbox';
import {useSiteLensDepthData} from '../../hooks/use-site-lens-depth-data';
import type {ITreeDiagramProps, FilterMode, ITreeNode} from '../../types';
import {TREE_DIRECTION_OPTIONS, DEPTH_COLORS} from '../../constants';
import {WATERMARK_CONFIG, getThemeColors, applyFilterToTreeNodes, convertGraphToTree} from '../../functions';
import {useTooltipPositioning} from '../../hooks/use-tooltip-positioning';

const directions = TREE_DIRECTION_OPTIONS;

const selectTriggerBase = [
  'cursor-pointer flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs',
  'transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'disabled:cursor-not-allowed disabled:opacity-50 h-9',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
].join(' ');

const dropdownContentBase = 'shadow-sm max-h-[min(var(--radix-dropdown-menu-content-available-height),300px)] min-w-[var(--radix-dropdown-menu-trigger-width)]';

const radioItemReset = 'cursor-pointer pl-2 [&>span:first-child]:hidden';

const treeTriggerBase = 'h-[30px]! rounded-md border border-solid shadow-none! [&>svg]:opacity-100!';

const treeSelectDark = [
  treeTriggerBase,
  'bg-[#444648]! border-transparent! text-white',
  '[&>svg]:text-white!',
  'hover:border-transparent',
].join(' ');

const treeSelectLight = [
  treeTriggerBase,
  'bg-[#e0e0e0]! border-[#d9d9d9]! text-[#1a1a1a]',
  '[&>svg]:text-[#1a1a1a]!',
  'hover:border-brand-primary/30',
].join(' ');

const dropdownDark = 'rounded-md bg-[#444648] border border-solid border-[#6f6f6f]';

const dropdownLight = 'rounded-md bg-white border border-solid border-[#e0e0e0]';

const treeItemBase = [
  'rounded my-0.5 transition-all duration-200 ease-in-out',
  'data-[state=checked]:bg-brand-primary data-[state=checked]:text-white data-[state=checked]:font-medium',
  'pr-2 [&_[data-slot=select-item-indicator]]:hidden',
].join(' ');

const treeItemDark = [
  treeItemBase,
  'text-white focus:bg-[rgba(127,78,173,0.25)] focus:text-white',
].join(' ');

const treeItemLight = [
  treeItemBase,
  'text-[#1a1a1a] focus:bg-[rgba(127,78,173,0.15)] focus:text-[#1a1a1a]',
].join(' ');

const checkboxClasses = [
  'mr-2.5',
  '[&_.ant-checkbox-wrapper:hover]:border-brand-primary/30',
  '[&_.ant-checkbox-checked_.ant-checkbox-inner]:bg-brand-primary',
  '[&_.ant-checkbox-checked_.ant-checkbox-inner]:border-brand-primary/30',
  '[&_.ant-checkbox-checked_.ant-checkbox-inner]:!rounded',
  'focus:!border-brand-primary/30 focus:!shadow-none',
  'hover:!border-brand-primary/30 hover:!shadow-none',
].join(' ');

export const TreeDiagram = observer(({
  theme,
  showWatermark = true,
  watermarkLogoUrl,
  selectedPageIds = new Set(),
  filterMode = 'deemphasize',
  showPrunable = false,
  hideOrphans = false,
  orphanNodeIds = new Set(),
  metricRanges,
  metricBounds,
}: ITreeDiagramProps) => {
  const [showLabels, setShowLabels] = useState(false);
  const [direction, setDirection] = useState('horizontal');
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const hasSelection = selectedPageIds.size > 0;
  const {depthNodes, depthNodesGraph, loadingDepthNodes} = useSiteLensDepthData();

  const handleDirectionChange = (val: string) => {
    setDirection(val);
  };

  const processNodeWithBorders = useCallback((node: any): any => {
    if (!node) return node;

    const isOrphan = orphanNodeIds.has(node.id);
    const isPrunable = node.isPrunable === true;
    const depth = node.depth ?? 0;
    const defaultNodeColor = DEPTH_COLORS[depth] || DEPTH_COLORS[5] || '#667085';

    let borderWidth = 2;
    let nodeColor = defaultNodeColor;

    if (!hideOrphans && isOrphan) {
      borderWidth = 3;
      nodeColor = '#FF9800';
    } else if (showPrunable && isPrunable) {
      borderWidth = 3;
      nodeColor = '#E74C3C';
    }

    const itemStyle: any = {
      color: nodeColor,
      borderWidth: borderWidth,
    };

    if (node.itemStyle) {
      Object.assign(itemStyle, node.itemStyle);
      itemStyle.borderWidth = borderWidth;
      itemStyle.color = nodeColor;
    }

    // Preserve symbolSize: 0 for filtered nodes (to hide them), otherwise normalize to undefined
    // so all visible nodes use the series-level symbolSize: 7
    const normalizedSymbolSize = node.symbolSize === 0 ? 0 : undefined;

    const processedNode = {
      ...node,
      itemStyle: itemStyle,
      // Normalize symbolSize to ensure all visible nodes display at the same size
      // Remove individual symbolSize to use series-level symbolSize instead
      symbolSize: normalizedSymbolSize,
    };

    if (node.children && node.children.length > 0) {
      processedNode.children = node.children.map((child: any) => processNodeWithBorders(child));
    }

    return processedNode;
  }, [showPrunable, hideOrphans, orphanNodeIds]);

  const treeDataFromGraph = useMemo(() => {
    if (!depthNodesGraph) return null;
    const graphNodes = (depthNodesGraph as {nodes?: unknown[]} | null)?.nodes as ITreeNode[] ?? [];
    const graphLinks = (depthNodesGraph as {links?: Array<{source: number | ITreeNode; target: number | ITreeNode}>} | null)?.links ?? [];

    if (graphNodes.length > 0 && graphLinks.length > 0) {
      return convertGraphToTree(graphNodes, graphLinks);
    }
    return null;
  }, [depthNodesGraph]);

  const processedTreeData = useMemo(() => {
    let treeData = null;
    if (depthNodes && depthNodes.children && depthNodes.children.length > 0) {
      treeData = depthNodes;
    } else if (treeDataFromGraph) {
      treeData = treeDataFromGraph;
    } else if (depthNodes) {
      treeData = depthNodes;
    }

    if (!treeData) return null;

    const filteredNode = applyFilterToTreeNodes(treeData, selectedPageIds, filterMode as FilterMode, hasSelection, orphanNodeIds, hideOrphans, metricRanges, metricBounds);
    if (!filteredNode) return null;
    return processNodeWithBorders(filteredNode);
  }, [depthNodes, treeDataFromGraph, selectedPageIds, filterMode, hasSelection, orphanNodeIds, hideOrphans, processNodeWithBorders, metricRanges, metricBounds]);

  // Data fetching now owned by useSiteLensDepthData — parent SiteVisualization
  // hooks it once and React Query shares the cached payload with every child.

  const tooltipTextClass = isDark ? 'text-white' : 'text-[#1a1a1a]';

  // Memoize ECharts option outside of JSX to avoid hooks error
  const echartsOption = useMemo(() => ({
    backgroundColor: themeColors.bg,
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      enterable: true,
      appendToBody: true,
      borderColor: themeColors.tooltipBorder,
      borderWidth: 2,
      padding: 20,
      backgroundColor: themeColors.tooltipBg,
      formatter: function(item: any) {
        const element = (
          <div>
            <div className={`max-w-[400px] overflow-hidden text-ellipsis ${tooltipTextClass}`}>{item.name}</div>
            <div><a className='block max-w-[400px] overflow-hidden text-ellipsis' href={item.data.url} target='_blank' rel='noreferrer'>{item.data.url}</a></div>
            <div className={`flex justify-between ${tooltipTextClass}`}>
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
        type: 'tree',
        data: processedTreeData ? [processedTreeData] : [],
        roam: true,
        initialTreeDepth: -1,
        orient: direction === 'horizontal' ? 'LR' : 'TB',
        top: '1%',
        left: '7%',
        bottom: '1%',
        right: '20%',
        symbolSize: 7,
        label: {
          show: showLabels,
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 10,
          color: themeColors.textMuted,
          rotate: direction === 'vertical' ? -90 : 0,
          formatter: function(d: any) {
            return d.data.url;
          },
        },
        lineStyle: {
          color: themeColors.lineColor,
        },
        emphasis: {
          focus: 'ancestor',
          lineStyle: {
            color: themeColors.text,
          },
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
          },
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
      },
    ],
  }), [themeColors, processedTreeData, direction, showLabels, tooltipTextClass]);

  // Use tooltip positioning hook to prevent viewport overflow
  useTooltipPositioning();

  const hasDataToDisplay = useMemo(() => {
    if (processedTreeData) {
      return (processedTreeData.children && processedTreeData.children.length > 0) || processedTreeData.id !== undefined;
    }
    return false;
  }, [processedTreeData]);

  return (
    !loadingDepthNodes && (depthNodes || depthNodesGraph) && (
      hasDataToDisplay ?
        (<>
          <div className='h-[58px] mt-4'>
            <div className='flex flex-wrap gap-[18px]'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type='button' className={`${selectTriggerBase} w-[180px] ${isDark ? treeSelectDark : treeSelectLight}`}>
                    <span className='pointer-events-none min-w-0 truncate'>{directions.find(opt => opt.value === direction)?.label}</span>
                    <ChevronDownIcon className='size-4 opacity-50' />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='center' className={`${dropdownContentBase} ${isDark ? dropdownDark : dropdownLight}`}>
                  <DropdownMenuRadioGroup value={direction} onValueChange={handleDirectionChange}>
                    {directions.map(opt => (
                      <DropdownMenuRadioItem key={opt.value} value={opt.value} className={`${radioItemReset} ${isDark ? treeItemDark : treeItemLight}`}>
                        {opt.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Checkbox
                primary='light'
                className={`${checkboxClasses} mt-0!`}
                transparent={false}
                checked={showLabels}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowLabels(e.target.checked)}
                labelClassName={isDark ? 'text-white!' : 'text-[#1a1a1a]!'}
              >
                Show URL Paths
              </Checkbox>
            </div>
          </div>
          <div className='relative flex-1 min-h-0'>
            {/* Fixed watermark overlay */}
            {showWatermark && (
              <div
                className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] max-w-[500px] pointer-events-none z-10 flex items-center justify-center'
                style={{opacity: WATERMARK_CONFIG?.opacity}}
              >
                <img
                  src={WATERMARK_CONFIG.getLogoPath(theme, watermarkLogoUrl)}
                  alt=''
                  className='w-full h-auto'
                />
              </div>
            )}
            <ReactECharts
              key={`tree-${showPrunable}-${hideOrphans}`}
              style={{height: '100%'}}
              className={isDark ? 'bg-[#24262a]' : 'bg-[#f5f5f5]'}
              option={echartsOption}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
        </>) :
        (<div className="font-['Manrope',sans-serif] text-sm">
          <EmptyState className={isDark ? 'text-white' : 'text-[#1a1a1a]'} />
        </div>)
    )
  );
});

