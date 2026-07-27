import React from 'react';
import {SimpleTooltip} from '@/shared/ui/composed/simple-tooltip';
import type {ISectionData, ILinkDetail} from '../../types';

interface ITextWithTooltipProps {
  text: string;
  className: string;
  maxLength?: number;
}

const TextWithTooltip: React.FC<ITextWithTooltipProps> = ({text, className, maxLength = 10}) => {
  const isTruncated = text && text.length > maxLength;

  const content = (
    <div className={`${className}${isTruncated ? ' cursor-pointer' : ''}`}>
      {text}
    </div>
  );

  if (isTruncated) {
    return (
      <SimpleTooltip title={text} placement='top' overlayInnerStyle={{backgroundColor: '#1a1b1f'}}>
        {content}
      </SimpleTooltip>
    );
  }

  return content;
};

interface IChordDetailPanelProps {
  selectedSection: ISectionData | null;
  selectedRibbon: { source: ISectionData; target: ISectionData; linkCount: number } | null;
  linkDetails: ILinkDetail[];
  handleBackgroundClick: () => void;
  isDark: boolean;
  textClass: string;
  subtextClass: string;
  listBgClass: string;
  borderColor: string;
}

export const ChordDetailPanel: React.FC<IChordDetailPanelProps> = ({
  selectedSection,
  selectedRibbon,
  linkDetails,
  handleBackgroundClick,
  isDark,
  textClass,
  subtextClass,
  listBgClass,
  borderColor,
}) => {
  return (
    <div
      className={`box-border h-full overflow-y-auto p-4 relative w-[320px] border-l border-solid ${
        isDark ? 'bg-[#1a1b1f] border-l-[#4E5156]' : 'bg-white border-l-[#e0e0e0]'
      }`}
    >
      <button
        onClick={handleBackgroundClick}
        className={`bg-transparent border-0 cursor-pointer text-xl leading-none px-2 py-1 absolute right-2 top-2 hover:opacity-70 ${subtextClass}`}
      >
        &times;
      </button>

      {selectedSection && (
        <>
          <div className='flex items-center gap-2 mb-4'>
            <div
              className='rounded h-4 w-4'
              style={{background: selectedSection.color}}
            />
            <h3 className={`text-lg m-0 capitalize ${textClass}`}>
              {selectedSection.name}
            </h3>
          </div>

          <div className='grid gap-3 grid-cols-2 mb-5'>
            <div className={`rounded-lg p-3 ${listBgClass}`}>
              <div className={`text-xs mb-1 ${subtextClass}`}>Pages</div>
              <div className={`text-xl font-semibold ${textClass}`}>
                {selectedSection.nodeIds.size}
              </div>
            </div>
            <div className={`rounded-lg p-3 ${listBgClass}`}>
              <div className={`text-xs mb-1 ${subtextClass}`}>Usage</div>
              <div className={`text-xl font-semibold ${textClass}`}>
                {selectedSection.totalTraffic.toLocaleString()}
              </div>
            </div>
            <div className={`rounded-lg col-span-2 p-3 ${listBgClass}`}>
              <div className={`text-xs mb-1 ${subtextClass}`}>Outbound Links</div>
              <div className={`text-xl font-semibold ${textClass}`}>
                {selectedSection.totalLinks}
              </div>
            </div>
          </div>

          <h4 className={`text-sm m-0 mb-3 ${textClass}`}>
            Pages in this section
          </h4>
          <div className={`rounded-lg max-h-[300px] overflow-y-auto ${listBgClass}`}>
            {selectedSection.nodes.slice(0, 50).map((node, i) => (
              <div
                key={node.id}
                className='text-xs px-3 py-2'
                style={{
                  borderBottom: i < Math.min(selectedSection.nodes.length - 1, 49) ?
                    `1px solid ${borderColor}` :
                    'none',
                }}
              >
                <TextWithTooltip
                  text={node.name || ''}
                  className={`overflow-hidden text-ellipsis whitespace-nowrap ${textClass}`}
                />
                <TextWithTooltip
                  text={node.url}
                  className={`text-[11px] overflow-hidden text-ellipsis whitespace-nowrap ${subtextClass}`}
                />
              </div>
            ))}
            {selectedSection.nodes.length > 50 && (
              <div className={`text-xs px-3 py-2 text-center ${subtextClass}`}>
                + {selectedSection.nodes.length - 50} more pages
              </div>
            )}
          </div>
        </>
      )}

      {selectedRibbon && (
        <>
          <div className='mb-4'>
            <h3 className={`text-base m-0 mb-2 ${textClass}`}>
              Link Flow
            </h3>
            <div className='flex items-center flex-wrap gap-2'>
              <div className={`flex items-center rounded-2xl text-[13px] gap-1.5 px-3 py-1.5 capitalize ${listBgClass}`}>
                <div
                  className='rounded-full h-2.5 w-2.5'
                  style={{background: selectedRibbon.source.color}}
                />
                <span className={textClass}>
                  {selectedRibbon.source.name}
                </span>
              </div>
              <span className={subtextClass}>&harr;</span>
              <div className={`flex items-center rounded-2xl text-[13px] gap-1.5 px-3 py-1.5 capitalize ${listBgClass}`}>
                <div
                  className='rounded-full h-2.5 w-2.5'
                  style={{background: selectedRibbon.target.color}}
                />
                <span className={textClass}>
                  {selectedRibbon.target.name}
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-lg mb-5 p-4 text-center ${listBgClass}`}>
            <div className={`text-xs mb-1 ${subtextClass}`}>Total Links</div>
            <div className={`text-[28px] font-semibold ${textClass}`}>
              {selectedRibbon.linkCount}
            </div>
          </div>

          <h4 className={`text-sm m-0 mb-3 ${textClass}`}>
            Link Details
          </h4>
          <div className={`rounded-lg max-h-[280px] overflow-y-auto ${listBgClass}`}>
            {linkDetails.length > 0 ? (
              linkDetails.map((link, i) => (
                <div
                  key={i}
                  className='text-[11px] px-3 py-2.5'
                  style={{
                    borderBottom: i < linkDetails.length - 1 ?
                      `1px solid ${borderColor}` :
                      'none',
                  }}
                >
                  <div className={`overflow-hidden text-ellipsis whitespace-nowrap ${textClass}`}>
                    <span style={{color: selectedRibbon.source.color}}>&#9679;</span>{' '}
                    {link.sourceUrl.replace(/https?:\/\/[^/]+/, '')}
                  </div>
                  <div className={`my-1 pl-3 ${subtextClass}`}>
                    &darr;
                  </div>
                  <div className={`overflow-hidden text-ellipsis whitespace-nowrap ${textClass}`}>
                    <span style={{color: selectedRibbon.target.color}}>&#9679;</span>{' '}
                    {link.targetUrl.replace(/https?:\/\/[^/]+/, '')}
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-5 text-center ${subtextClass}`}>
                No direct links found
              </div>
            )}
            {linkDetails.length >= 50 && (
              <div className={`text-xs px-3 py-2 text-center ${subtextClass}`}>
                Showing first 50 links
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
