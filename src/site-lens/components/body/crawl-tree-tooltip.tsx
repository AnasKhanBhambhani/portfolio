import React from 'react';
import type {ITreeNode} from '../../types';
import {getHealthColor} from '../../functions';

interface ICrawlTreeTooltipProps {
  tooltip: { node: ITreeNode; x: number; y: number };
  textClass: string;
  subtextClass: string;
  tooltipClass: string;
  showPrunableIndicators: boolean;
}

export const CrawlTreeTooltip: React.FC<ICrawlTreeTooltipProps> = ({
  tooltip,
  textClass,
  subtextClass,
  tooltipClass,
  showPrunableIndicators,
}) => {
  return (
    <div
      className={tooltipClass}
      style={{
        left: tooltip.x + 15,
        top: tooltip.y - 10,
      }}
    >
      <div className={`font-semibold mb-1 ${textClass}`}>
        {tooltip.node.url?.replace(/^https?:\/\/[^/]+/, '') || tooltip.node.name || '/'}
      </div>
      <div className='text-brand-primary text-[11px] mb-2.5 break-all'>
        {tooltip.node.url}
      </div>
      <div className='flex gap-5 justify-between'>
        <div className={`[&>div]:mb-1 ${subtextClass}`}>
          <div>Depth:</div>
          <div>Health:</div>
          <div>Issues:</div>
          <div>Usage:</div>
          <div>Status:</div>
        </div>
        <div className={`text-right [&>div]:mb-1 ${textClass}`}>
          <div>{tooltip.node.depth}</div>
          <div className='flex items-center gap-1.5 justify-end'>
            {tooltip.node.pageHealth !== undefined && (() => {
              const health = tooltip.node.pageHealth;
              let healthScore: number;

              // Convert to 0-100 scale for color calculation
              if (health > 100) {
                // 0-1000 scale -> convert to 0-100 for color
                healthScore = health / 10;
              } else if (health > 1) {
                // Already 0-100 scale
                healthScore = health;
              } else {
                // 0-1 scale -> convert to 0-100 for color
                healthScore = health * 100;
              }

              // Display raw score without percentage sign
              const displayValue = Math.round(health).toString();

              return (
                <>
                  <span
                    className='rounded-full inline-block h-1.5 w-1.5'
                    style={{background: getHealthColor(healthScore)}}
                  />
                  {displayValue}
                </>
              );
            })()}
          </div>
          <div className='flex items-center gap-1.5 justify-end'>
            {tooltip.node.issueCount !== undefined && (
              <>
                <span
                  className='rounded-full inline-block h-1.5 w-1.5'
                  style={{background: tooltip.node.issueCount > 0 ? '#F44343' : '#2AC155'}}
                />
                {tooltip.node.issueCount || 'None'}
              </>
            )}
          </div>
          <div>{tooltip.node.traffic?.toLocaleString() || '-'}</div>
          <div className='flex items-center gap-1.5 justify-end'>
            {tooltip.node.status && (
              <>
                <span
                  className='rounded-full inline-block h-1.5 w-1.5'
                  style={{background: tooltip.node.status === 'Active' ? '#2AC155' : '#F44343'}}
                />
                {tooltip.node.status}
              </>
            )}
          </div>
        </div>
      </div>
      {showPrunableIndicators && tooltip.node.isPrunable && (
        <div className='bg-[rgba(231,76,60,0.1)] rounded text-[#e74c3c] text-[11px] mt-2.5 px-2.5 py-1.5'>
          Candidate for pruning (low traffic/health)
        </div>
      )}
    </div>
  );
};
