import React from 'react';
import type {ICrawlTreeProps} from '../../types';
import {DEPTH_COLORS} from '../../constants';
import {useCrawlTree} from './use-crawl-tree';
import {CrawlTreeTooltip} from './crawl-tree-tooltip';

export const CrawlTree: React.FC<ICrawlTreeProps> = props => {
  const {
    showPrunableIndicators = true,
  } = props;

  const {
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
  } = useCrawlTree(props);

  const textClass = isDark ? 'text-[#e8e8e8]' : 'text-[#333]';
  const subtextClass = isDark ? 'text-[#a3a4a4]' : 'text-[#666]';

  const depthBtnBase = [
    'items-center border border-solid rounded-2xl cursor-pointer flex text-xs',
    'gap-1.5 h-7 min-w-[84px] px-3 py-1.5 transition-all duration-200 ease-in-out whitespace-nowrap',
  ].join(' ');

  const getDepthBtnClass = (isActive: boolean, isExact: boolean) => {
    if (isExact) {
      return `${depthBtnBase} opacity-100 border-2 ${isDark ?
        'bg-[rgba(127,78,173,0.4)] border-brand-primary/30 text-[#e8e8e8]' :
        'bg-[rgba(127,78,173,0.15)] border-[rgba(127,78,173,0.5)] text-[#333]'
      }`;
    }
    if (isActive) {
      return `${depthBtnBase} opacity-100 ${isDark ?
        'bg-[rgba(127,78,173,0.08)] border-brand-primary/30 text-[#e8e8e8]' :
        'bg-[rgba(127,78,173,0.08)] border-[rgba(127,78,173,0.5)] text-[#333]'
      }`;
    }
    return `${depthBtnBase} opacity-50 ${isDark ?
      'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#a3a4a4]' :
      'bg-[rgba(0,0,0,0.05)] border-[rgba(0,0,0,0.1)] text-[#333]'
    }`;
  };

  const resetBtnClass = [
    'items-center border border-solid rounded-md cursor-pointer flex text-xs',
    'h-8 left-5 px-3.5 py-2 absolute top-5 whitespace-nowrap w-[91px] z-10',
    isDark ?
      'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#e8e8e8] hover:bg-[rgba(255,255,255,0.1)]' :
      'bg-[rgba(0,0,0,0.05)] border-[rgba(0,0,0,0.1)] text-[#333] hover:bg-[rgba(0,0,0,0.1)]',
  ].join(' ');

  const tooltipClass = [
    'border border-solid rounded-lg max-w-[350px] px-4 py-3 pointer-events-none absolute z-[1000]',
    isDark ?
      'bg-[#1a1a1a] border-[rgba(255,255,255,0.2)] shadow-[0_4px_12px_rgba(0,0,0,0.5)]' :
      'bg-white border-[rgba(0,0,0,0.1)] shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
  ].join(' ');

  return (
    <div
      ref={containerRef}
      className={`flex-1 min-h-[500px] relative w-full ${isDark ? 'bg-[#121317]' : 'bg-[#f5f5f5]'}`}
    >
      {/* Loading state while measuring dimensions */}
      {!isReady && (
        <div className={`text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${subtextClass}`}>
          Loading visualization...
        </div>
      )}
      {/* Depth filter buttons */}
      <div className='flex gap-2 absolute right-5 top-5 z-10'>
        {depthLevels.map(depth => {
          const isActive = depth <= selectedMaxDepth;
          const isExactDepth = depth === selectedMaxDepth;
          return (
            <button
              key={depth}
              onClick={() => {
                // Clicking the current max depth reduces it by 1 (unless at 0)
                // Clicking any other depth sets it as the new max
                if (isExactDepth && depth > 0) {
                  setSelectedMaxDepth(depth - 1);
                } else {
                  setSelectedMaxDepth(depth);
                }
              }}
              className={getDepthBtnClass(isActive, isExactDepth)}
              title={isExactDepth ? `Click to hide depth ${depth}` : `Show up to depth ${depth}`}
            >
              <div
                className='rounded-full h-2.5 w-2.5'
                style={{
                  backgroundColor: DEPTH_COLORS[depth as keyof typeof DEPTH_COLORS],
                }}
              />
              <span>Depth {depth}</span>
            </button>
          );
        })}
      </div>

      {/* Reset zoom button */}
      <button
        onClick={resetZoom}
        className={resetBtnClass}
      >
        Reset View
      </button>

      {/* SVG Container */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={isDark ? 'bg-[#121317]' : 'bg-[#f5f5f5]'}
      />

      {/* Tooltip */}
      {tooltip && (
        <CrawlTreeTooltip
          tooltip={tooltip}
          textClass={textClass}
          subtextClass={subtextClass}
          tooltipClass={tooltipClass}
          showPrunableIndicators={showPrunableIndicators}
        />
      )}

      {/* Info bar */}
      <div className={`text-xs p-2.5 text-center ${subtextClass}`}>
        Showing: {visibleNodes} nodes | Max Depth: {selectedMaxDepth} | Scroll to zoom, drag to pan
      </div>
    </div>
  );
};

