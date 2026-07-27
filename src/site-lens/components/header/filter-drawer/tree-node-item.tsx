import React, {useCallback} from 'react';
import type {ITreeNodeItemProps, ITreeNode} from './types';
import {getAllNodeIds, countNodes, getShortName, getDepthClass, getNodeBackendId} from '../../../functions';

const DEPTH_COLORS: Record<string, string> = {
  depth0: '#7f4ead',
  depth1: '#00a8e8',
  depth2: '#12b76a',
  depth3: '#f79009',
  depth4: '#f04438',
  depth5: '#667085',
};

const ELLIPSIS_DISABLE_DEPTH = 7;
const NESTED_ROW_MAX_WIDTH = 300;
const ROW_BASE_PADDING_X = 8;
const DEPTH_INDENT = 25;

const TEXT_ELLIPSIS_CLASS = 'w-[180px] overflow-hidden text-ellipsis';
const SPACER_FIXED_CLASS = 'w-2';
const SPACER_GROW_CLASS = 'flex-1';

const childrenScrollClass = [
  'overflow-x-auto',
  '[&::-webkit-scrollbar]:h-2',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:bg-[#888] [&::-webkit-scrollbar-thumb]:rounded',
  '[&::-webkit-scrollbar-thumb:hover]:bg-[#555]',
].join(' ');

const hasVisibleNodeAtDepth = (
  node: ITreeNode,
  threshold: number,
  expandedNodes: Set<number>,
  collapsedNodes: Set<number>,
  defaultExpandDepth: number,
): boolean => {
  if (node.depth >= threshold) return true;
  const isOpen = !collapsedNodes.has(node.id) &&
    (expandedNodes.has(node.id) || node.depth < defaultExpandDepth);
  if (!isOpen || !node.children?.length) return false;
  return node.children.some(child =>
    hasVisibleNodeAtDepth(child, threshold, expandedNodes, collapsedNodes, defaultExpandDepth),
  );
};

export const TreeNodeItem: React.FC<ITreeNodeItemProps> = ({
  node,
  selectedIds,
  onToggleNode,
  onToggleSubtree,
  expandedNodes,
  onToggleExpand,
  theme,
  defaultExpandDepth,
  collapsedNodes = new Set(),
  disableEllipsis,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = collapsedNodes.has(node.id) ? false :
    (expandedNodes.has(node.id) || node.depth < defaultExpandDepth);
  const nodeBackendId = getNodeBackendId(node);
  const isSelected = selectedIds.has(nodeBackendId);
  const nodeCount = countNodes(node);
  const allChildIds = getAllNodeIds(node);
  const selectedChildCount = allChildIds.filter(id => selectedIds.has(id)).length;
  const isPartiallySelected = selectedChildCount > 0 && selectedChildCount < allChildIds.length;
  const depthClass = getDepthClass(node.depth);
  const depthColor = DEPTH_COLORS[depthClass] || '#667085';
  const isDark = theme === 'dark';
  const isRoot = node.depth === 0;
  const ellipsisDisabled = disableEllipsis ?? (isRoot && hasVisibleNodeAtDepth(
    node,
    ELLIPSIS_DISABLE_DEPTH,
    expandedNodes,
    collapsedNodes,
    defaultExpandDepth,
  ));

  const handleRowClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input[type="checkbox"]')) {
      return;
    }
    if (hasChildren) {
      onToggleSubtree(node, !isSelected);
    } else {
      onToggleNode(node, !isSelected);
    }
  }, [hasChildren, isSelected, node, onToggleNode, onToggleSubtree]);

  const rowContent = (
    <>
      <input
        type='checkbox'
        checked={isSelected}
        ref={el => {
          if (el) el.indeterminate = isPartiallySelected && !isSelected;
        }}
        onChange={e => {
          e.stopPropagation();
          if (hasChildren) {
            onToggleSubtree(node, e.target.checked);
          } else {
            onToggleNode(node, e.target.checked);
          }
        }}
        className='appearance-none border-[1.5px] border-solid rounded cursor-pointer shrink-0 h-[15px] m-0 mr-2 relative w-[15px]'
        style={{
          borderColor: isSelected ? 'transparent' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
          background: isSelected ? depthColor : (isDark ? '#1a1a1a' : '#fff'),
        }}
        aria-label={`Select ${getShortName(node.url)}`}
      />

      <div
        className='rounded-full shrink-0 h-2 mr-2 w-2'
        style={{backgroundColor: depthColor}}
      />

      <span
        className={`text-[13px] whitespace-nowrap ${ellipsisDisabled ? '' : TEXT_ELLIPSIS_CLASS} ${isDark ? 'text-[#e8e8e8]' : 'text-[#333]'} ${isRoot ? 'font-semibold' : ''}`}
        title={node.url}
      >
        {getShortName(node.url)}
      </span>

      <div className={`min-w-[4px] ${ellipsisDisabled ? SPACER_GROW_CLASS : SPACER_FIXED_CLASS}`} aria-hidden='true' />

      {hasChildren && (
        <span className={`rounded-[10px] shrink-0 text-[10px] py-[2px] px-2 ${isDark ? 'bg-[#161616] text-[#888]' : 'bg-[#f5f5f5] text-[#666]'}`}>
          ({nodeCount} items)
        </span>
      )}

      {hasChildren && isRoot && (
        <button
          type='button'
          onClick={e => {
            e.stopPropagation();
            onToggleExpand(node.id);
          }}
          className={`flex items-center bg-transparent border-0 cursor-pointer shrink-0 h-6 justify-center ml-2 p-0 w-6 ${isDark ? 'text-[#ccc]' : 'text-[#444]'}`}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg width='12' height='12' viewBox='0 0 10 10' fill='none' style={{transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease'}}>
            <path d='M2 3.5L5 6.5L8 3.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </button>
      )}
    </>
  );

  if (isRoot) {
    return (
      <div className='rounded-xl overflow-hidden'>
        <div
          className={`flex items-center cursor-pointer py-3 px-[14px] transition-[background] duration-[150ms] ease ${isDark ? 'bg-[#222] hover:bg-[rgba(255,255,255,0.06)]' : 'bg-[#eee] hover:bg-[#eaeaea]'}`}
          onClick={handleRowClick}
        >
          {rowContent}
        </div>

        {hasChildren && isExpanded && (
          <div className={`py-1 px-[6px] ${childrenScrollClass} ${isDark ? 'bg-[#121212]' : ''}`}>
            <div className='min-w-min'>
              {node.children!.map(child => (
                <TreeNodeItem
                  key={child.id}
                  node={child}
                  selectedIds={selectedIds}
                  onToggleNode={onToggleNode}
                  onToggleSubtree={onToggleSubtree}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  theme={theme}
                  defaultExpandDepth={defaultExpandDepth}
                  collapsedNodes={collapsedNodes}
                  disableEllipsis={ellipsisDisabled}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const rowPaddingLeft = ROW_BASE_PADDING_X + (node.depth - 1) * DEPTH_INDENT;

  return (
    <>
      <div
        className={`flex items-center rounded-md cursor-pointer mb-[1px] py-[5px] pr-2 transition-[background] duration-[150ms] ease ${isDark ? 'hover:bg-[rgba(255,255,255,0.05)]' : 'hover:bg-[#e8e8e8]'}`}
        style={{maxWidth: ellipsisDisabled ? undefined : NESTED_ROW_MAX_WIDTH, paddingLeft: rowPaddingLeft}}
        onClick={handleRowClick}
      >
        {hasChildren ? (
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className={`flex items-center bg-transparent border-0 cursor-pointer shrink-0 text-[10px] h-[18px] justify-center mr-1 p-0 w-[18px] ${isDark ? 'text-[#888]' : 'text-[#666]'}`}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg width='10' height='10' viewBox='0 0 10 10' fill='none' style={{transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease'}}>
              <path d='M2 3.5L5 6.5L8 3.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        ) : (
          <div className='shrink-0 w-[22px]' />
        )}

        {rowContent}
      </div>

      {hasChildren && isExpanded && node.children!.map(child => (
        <TreeNodeItem
          key={child.id}
          node={child}
          selectedIds={selectedIds}
          onToggleNode={onToggleNode}
          onToggleSubtree={onToggleSubtree}
          expandedNodes={expandedNodes}
          onToggleExpand={onToggleExpand}
          theme={theme}
          defaultExpandDepth={defaultExpandDepth}
          collapsedNodes={collapsedNodes}
          disableEllipsis={ellipsisDisabled}
        />
      ))}
    </>
  );
};

