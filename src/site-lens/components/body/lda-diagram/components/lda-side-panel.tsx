import React from 'react';
import {SimpleTooltip} from '@/shared/ui/composed/simple-tooltip';
import type {Topic} from '../../../../types';
import {scrollableBase, scrollableDark, scrollableLight} from './lda-chart-tailwind';

interface ILDASidePanelProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  hoveredTopic: Topic | null;
  isDark: boolean;
  setSelectedTopic: React.Dispatch<React.SetStateAction<Topic | null>>;
  onOpenWordCloud: (topic: Topic) => void;
}

const LDASidePanel: React.FC<ILDASidePanelProps> = ({
  topics,
  selectedTopic,
  hoveredTopic,
  isDark,
  setSelectedTopic,
  onOpenWordCloud,
}) => {
  const textClass = isDark ? 'text-[#e8e8e8]' : 'text-[#333]';
  const subtextClass = isDark ? 'text-[#888]' : 'text-[#666]';
  const scrollableTheme = isDark ? scrollableDark : scrollableLight;

  const sidePanelClass = [
    'max-h-screen p-4 w-[280px]',
    scrollableBase,
    scrollableTheme,
    isDark ?
      'bg-[#1a1b1f]' :
      'bg-white',
  ].join(' ');

  const displayTopic = selectedTopic || hoveredTopic;

  return (
    <div className={sidePanelClass}>
      <h3 className={`text-base m-0 mb-4 ${textClass}`}>
        Topics Overview
      </h3>

      <div className='mb-5'>
        {topics.map(topic => (
          <div
            key={topic.id}
            onClick={() => setSelectedTopic(prev => (prev?.id === topic.id ? null : topic))}
            className='items-center border-2 border-solid border-transparent rounded-md cursor-pointer flex mb-1 px-3 py-2 transition-all duration-200 ease-in-out hover:opacity-90'
            style={{
              background: selectedTopic?.id === topic.id ?
                `${topic.color}33` :
                hoveredTopic?.id === topic.id ?
                  `${topic.color}22` :
                  'transparent',
              borderColor: selectedTopic?.id === topic.id ? topic.color : 'transparent',
            }}
          >
            <div
              className='rounded-full shrink-0 h-3 mr-2.5 w-3'
              style={{background: topic.color}}
            />
            <div className='flex-1 min-w-0'>
              <SimpleTooltip title={topic.name} placement='left' color='#000'>
                <div className={`text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap ${textClass}`}>
                  {topic.name}
                </div>
              </SimpleTooltip>
              <div className={`text-[11px] ${subtextClass}`}>
                {topic.nodes.length} pages
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayTopic && (
        <div className='pt-4'>
          {selectedTopic && (
            <h4
              className='items-center flex text-sm gap-2 m-0 mb-3'
              style={{color: displayTopic.color}}
            >
              <div
                className='rounded-full h-2.5 w-2.5'
                style={{background: displayTopic.color}}
              />
              {displayTopic.name}
            </h4>
          )}

          <div className='mb-3'>
            <div className='items-center flex justify-between mb-2'>
              <div className={`text-[11px] font-medium ${subtextClass}`}>
                {!selectedTopic && hoveredTopic ? `HOVER: ${displayTopic.name}` : 'TOP KEYWORDS'}
              </div>
              {selectedTopic && (
                <button
                  onClick={() => onOpenWordCloud(displayTopic)}
                  className='border border-solid rounded cursor-pointer text-[10px] px-2 py-0.5 transition-all duration-200 hover:opacity-80'
                  style={{
                    background: `${displayTopic.color}22`,
                    color: displayTopic.color,
                    borderColor: `${displayTopic.color}44`,
                  }}
                >
                  View Word Cloud
                </button>
              )}
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {displayTopic.keywords && displayTopic.keywords.length > 0 ? (
                displayTopic.keywords.slice(0, 8).map((kw, i) => (
                  <span
                    key={i}
                    className='rounded text-[11px] font-medium px-3 py-1'
                    style={{
                      background: `${displayTopic.color}22`,
                      color: displayTopic.color,
                    }}
                  >
                    {kw}
                  </span>
                ))
              ) : (
                <span className={`text-[11px] ${subtextClass}`}>
                  No keywords available
                </span>
              )}
            </div>
          </div>

          {selectedTopic && (
            <>
              <div className='mb-3'>
                <div className={`text-[11px] mb-1 ${subtextClass}`}>
                  PAGES ({displayTopic.nodes?.length || 0})
                </div>
                <div className={`max-h-[300px] ${scrollableBase} ${scrollableTheme}`}>
                  {displayTopic.nodes && displayTopic.nodes.length > 0 ? (
                    displayTopic.nodes.map(node => (
                      <div
                        key={node.id}
                        className='text-[11px] py-2'
                      >
                        <a
                          href={node.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='block mb-1 no-underline break-all hover:underline'
                          style={{color: displayTopic.color}}
                          title={node.url}
                        >
                          {node.url}
                        </a>
                        <div className={`text-[10px] ${subtextClass}`}>
                          Usage: {node?.traffic?.toLocaleString()} | Proficiency: {node.pageHealth} | Level: {node.depth}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-[11px] py-2 ${subtextClass}`}>
                      No pages available
                    </div>
                  )}
                </div>
              </div>

              <div className={subtextClass}>
                <div className={`text-[11px] mb-1 ${subtextClass}`}>
                  STATISTICS
                </div>
                <div className='grid gap-2 grid-cols-2'>
                  <div className={`rounded-md p-2 ${isDark ? 'bg-[#2f3134]' : 'bg-[#f5f5f5]'}`}>
                    <div className={`text-sm font-semibold ${textClass}`}>
                      {displayTopic.nodes && displayTopic.nodes.length > 0 ?
                        displayTopic.nodes.reduce((sum, n) => sum + (n.traffic || 0), 0).toLocaleString() :
                        '0'}
                    </div>
                    <div className={`text-[10px] ${subtextClass}`}>Total Usage</div>
                  </div>
                  <div className={`rounded-md p-2 ${isDark ? 'bg-[#2f3134]' : 'bg-[#f5f5f5]'}`}>
                    <div className={`text-sm font-semibold ${textClass}`}>
                      {displayTopic.nodes && displayTopic.nodes.length > 0 ?
                        Math.round(displayTopic.nodes.reduce((sum, n) => sum + (n.pageHealth || 0), 0) / displayTopic.nodes.length) :
                        0}%
                    </div>
                    <div className={`text-[10px] ${subtextClass}`}>Avg Health</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LDASidePanel;
