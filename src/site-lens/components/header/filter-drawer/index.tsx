import React, {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFilter, faListCheck, faRefresh, faRotateLeft, faTrashCanXmark} from '@fortawesome/pro-regular-svg-icons';
import {faXmark} from '@fortawesome/pro-regular-svg-icons';
import {faChevronDown} from '@fortawesome/pro-regular-svg-icons';
import {faCheckDouble} from '@fortawesome/pro-regular-svg-icons';
import {useSiteLensDepthData} from '../../../hooks/use-site-lens-depth-data';
import type {IPageSelectorProps} from './types';
import {METRICS} from '../../../constants';
import InfoIcon from './info-icon';
import MetricSlider from './metric-slider';
import {TreeNodeItem} from './tree-node-item';
import useFilterDrawerData, {DEFAULT_EXPAND_DEPTH} from '../../../hooks/use-filter-drawer-data';
import useTreeState from '../../../hooks/use-tree-state';


const scrollableClass = [
  'flex-1 min-h-0 overflow-y-auto',
  '[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2',
  '[&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded',
  '[&::-webkit-scrollbar-thumb]:bg-[#888] [&::-webkit-scrollbar-thumb]:rounded',
  '[&::-webkit-scrollbar-thumb:hover]:bg-[#555]',
].join(' ');

const PageSelector: React.FC<IPageSelectorProps> = observer(({
  theme,
  isOpen,
  onToggle,
  selectedIds,
  onSelectionChange,
  filterMode,
  onFilterModeChange,
  onMetricFiltersChange,
}) => {
  const {depthNodes, depthNodesGraph, loadingDepthNodes} = useSiteLensDepthData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMetricFilters, setShowMetricFilters] = useState(false);

  const drawerData = useFilterDrawerData({
    depthNodes,
    depthNodesGraph,
    loadingDepthNodes: loadingDepthNodes ?? false,
    selectedIds,
    searchQuery,
    onMetricFiltersChange,
  });

  const {
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
  } = drawerData;

  const treeState = useTreeState({
    data,
    defaultExpandDepth: DEFAULT_EXPAND_DEPTH,
    allNodeIdsForExpand,
    allNodeIds,
    selectedIds,
    onSelectionChange,
    depthNodes,
    depthNodesGraph,
  });

  const {
    expandedNodes,
    collapsedNodes,
    handleToggleExpand,
    handleToggleNode,
    handleToggleSubtree,
    handleSelectAll,
    handleDeselectAll,
    handleInvertSelection,
  } = treeState;

  if (!isOpen) {
    return null;
  }

  if (!data) {
    return null;
  }

  const isDark = theme === 'dark';
  const textClass = isDark ? 'text-[#e8e8e8]' : 'text-[#333]';
  const subtextClass = isDark ? 'text-[#888]' : 'text-[#666]';
  const borderBClass = isDark ?
    'border-b border-b-[#4e5156]' :
    'border-b border-b-[#e0e0e0]';

  const bulkBtnClass = `flex items-center gap-1.5 rounded cursor-pointer text-xs py-1.5 px-3 ${isDark ?
    'bg-[#2f3134] border border-[#4e5156] text-[#e8e8e8] hover:bg-[#3a3c40]' :
    'bg-[#f0f0f0] border border-[#e0e0e0] text-[#333] hover:bg-[#e8e8e8]'}`;

  const filterBtnBase = 'items-center border-0 rounded cursor-pointer inline-flex text-[11px] gap-[5px] justify-center py-1.5 px-[13px] transition-all duration-200 ease-in-out whitespace-nowrap leading-none';
  const filterBtnActiveClass = `${filterBtnBase} bg-brand-primary text-white font-semibold`;
  const filterBtnInactiveClass = `${filterBtnBase} bg-transparent font-normal ${textClass}`;

  const activeIconColorClass = 'text-[rgba(255,255,255,0.8)] hover:text-white';
  const inactiveIconColorClass = isDark ? 'text-[#888] hover:text-[#e8e8e8]' : 'text-[#666] hover:text-[#333]';

  const searchInputClass = `rounded-md box-border text-[13px] outline-none py-2.5 pl-8 pr-3 w-full ${isDark ?
    'bg-[#2f3134] border border-[#4e5156] text-[#e8e8e8] placeholder:text-[#888]' :
    'bg-white border border-[#e0e0e0] text-[#333] placeholder:text-[#666]'}`;

  return (
    <>
      <div className='bg-[rgba(0,0,0,0.3)] inset-0 fixed z-[999]' onClick={onToggle} />

      <div className={`shadow-[4px_0_24px_rgba(0,0,0,0.2)] flex flex-col h-screen left-0 fixed top-0 w-[360px] z-[1000] ${isDark ?
        'bg-[#1a1b1f] border-r border-r-[#4e5156]' :
        'bg-white border-r border-r-[#e0e0e0]'}`}
      >
        <div className={`items-center flex justify-between p-4 ${borderBClass}`}>
          <div>
            <div className='flex items-center gap-2'>
              <span className='flex items-center'>
                <FontAwesomeIcon icon={faFilter} fontSize={16} color={theme === 'dark' ? '#e8e8e8' : '#333'} />
              </span>
              <h3 className={`text-base font-semibold m-0 ${textClass}`}>
                Filter pages
              </h3>
            </div>
            <p className={`text-xs m-0 mt-1 ${subtextClass}`}>
              {selectedIds.size === 0 ? 'All' : selectedIds.size} of {totalNodes} pages selected
            </p>
          </div>
          <button
            onClick={onToggle}
            className={`items-center bg-transparent border-0 rounded cursor-pointer flex text-xl h-8 justify-center w-8 ${isDark ?
              'text-[#888] hover:bg-[#2f3134]' :
              'text-[#666] hover:bg-[#f5f5f5]'}`}
            type='button'
            aria-label='Close drawer'
          >
            <FontAwesomeIcon icon={faXmark} fontSize={16} />
          </button>
        </div>

        <div className={`py-3 px-4 ${borderBClass}`}>
          <div className='relative flex items-center'>
            <span className={`absolute left-3 flex items-center pointer-events-none ${subtextClass}`}>
              <svg width='14' height='14' viewBox='0 0 16 16' fill='none'>
                <circle cx='7' cy='7' r='5.5' stroke='currentColor' strokeWidth='1.5' />
                <path d='M11 11L14.5 14.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
              </svg>
            </span>
            <input
              type='text'
              placeholder='Search page...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={searchInputClass}
              aria-label='Search pages'
            />
          </div>
        </div>

        <div className={`items-center flex gap-2 py-3 px-4 ${borderBClass}`}>
          <span className={`text-xs mr-1 ${subtextClass}`}>
            Filtered nodes:
          </span>
          <div className={`rounded-md flex p-0.5 ${isDark ? 'bg-[#2f3134]' : 'bg-[#f0f0f0]'}`}>
            <div className='items-center flex'>
              <button
                type='button'
                onClick={() => onFilterModeChange('deemphasize')}
                className={filterMode === 'deemphasize' ? filterBtnActiveClass : filterBtnInactiveClass}
              >
                <span>De-emphasize</span>
                <InfoIcon
                  theme={theme}
                  title="Fades out pages that don't match your filters"
                  colorClass={filterMode === 'deemphasize' ? activeIconColorClass : inactiveIconColorClass}
                />
              </button>
            </div>
            <div className='items-center flex'>
              <button
                type='button'
                onClick={() => onFilterModeChange('remove')}
                className={filterMode === 'remove' ? filterBtnActiveClass : filterBtnInactiveClass}
              >
                <span>Remove</span>
                <InfoIcon
                  theme={theme}
                  title="Completely hides pages that don't match"
                  colorClass={filterMode === 'remove' ? activeIconColorClass : inactiveIconColorClass}
                />
              </button>
            </div>
          </div>
        </div>

        <div className={scrollableClass}>
          <div className={borderBClass}>
            <button
              type='button'
              onClick={() => setShowMetricFilters(!showMetricFilters)}
              className={`items-center bg-transparent border-0 cursor-pointer flex text-[13px] font-medium justify-between py-2.5 px-4 w-full ${textClass}`}
              aria-expanded={showMetricFilters}
            >
              <span className='items-center flex gap-1.5'>
                Filter by Metrics
                {hasActiveMetricFilters && (
                  <span className='bg-brand-primary rounded-[10px] text-white text-[10px] py-0.5 px-1.5'>Active</span>
                )}
              </span>
              <span className={`flex items-center text-[10px] ${subtextClass}`}>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  fontSize={12}
                  style={{
                    transform: showMetricFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </span>
            </button>

            {showMetricFilters && (
              <div className='pt-0 px-4 pb-3'>
                <div className={`items-center flex justify-between mb-3 pb-2 ${borderBClass}`}>
                  <span className={`text-[11px] ${subtextClass}`}>
                    {nodesPassingMetricFilters.size} of {nodes.length} pages match
                  </span>
                  <div className='flex gap-2'>
                    <button
                      type='button'
                      onClick={handleResetMetricFilters}
                      disabled={!canResetFilters}
                      className={`flex items-center gap-1 bg-transparent border-0 cursor-pointer text-[11px] py-1 px-2 ${canResetFilters ?
                        'text-brand-primary opacity-100' :
                        `cursor-default opacity-50 ${subtextClass}`}`}
                    >
                      <span className='flex items-center'>
                        <FontAwesomeIcon icon={faRotateLeft} fontSize={12} />
                      </span>
                      Reset
                    </button>
                  </div>
                </div>

                {METRICS.map(metric => {
                  const bounds = metricBounds[metric.key];
                  return (
                    <MetricSlider
                      key={metric.key}
                      label={metric.label}
                      tooltip={metric.tooltip}
                      dataMin={bounds?.min ?? 0}
                      dataMax={bounds?.max ?? 0}
                      currentMin={metricRanges[metric.key]?.min ?? 0}
                      currentMax={metricRanges[metric.key]?.max ?? 0}
                      onChange={(min, max) => handleMetricRangeChange(metric.key, min, max)}
                      format={metric.format}
                      theme={theme}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className={`items-center flex flex-wrap gap-2 py-2.5 px-4 ${borderBClass}`}>
            <span className={`flex items-center gap-1.5 text-xs ${subtextClass}`}>
              <span className='flex items-center'>
                <FontAwesomeIcon icon={faListCheck} />
              </span>
              Bulk Actions:
            </span>
            <div className='flex-1' />
            <button type='button' onClick={handleSelectAll} className={bulkBtnClass}>
              <span className='flex items-center'>
                <FontAwesomeIcon icon={faCheckDouble} fontSize={11} />
              </span>
              Select all
            </button>
            <button type='button' onClick={handleInvertSelection} className={bulkBtnClass}>
              <span className='flex items-center'>
                <FontAwesomeIcon icon={faRefresh} fontSize={11} />
              </span>
              Invert
            </button>
            <button type='button' onClick={handleDeselectAll} className={bulkBtnClass}>
              <span className='flex items-center'>
                <FontAwesomeIcon icon={faTrashCanXmark} fontSize={11} />
              </span>
              Clear
            </button>
          </div>

          <div className='py-3 px-4'>
            {searchQuery.trim() && !filteredData.hasMatches ? (
              <div className={`items-center flex text-sm justify-center py-10 px-4 text-center ${subtextClass}`}>
                No data found
              </div>
            ) : filteredData.data ? (
              <TreeNodeItem
                key={`tree-${filteredData.data.id}-${totalNodes}`}
                node={filteredData.data}
                selectedIds={selectedIds}
                onToggleNode={handleToggleNode}
                onToggleSubtree={handleToggleSubtree}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
                theme={theme}
                defaultExpandDepth={DEFAULT_EXPAND_DEPTH}
                collapsedNodes={collapsedNodes}
              />
            ) : null}
          </div>
        </div>

        <div className={`text-[11px] py-2 px-4 text-center ${isDark ?
          'border-t border-t-[#4e5156] text-[#888]' :
          'border-t border-t-[#e0e0e0] text-[#666]'}`}
        >
          {selectedIds.size === 0 ?
            'Showing all pages. Select pages to filter.' :
            `Showing ${selectedIds.size} selected page${selectedIds.size !== 1 ? 's' : ''}`}
        </div>
      </div>
    </>
  );
});

export default PageSelector;
