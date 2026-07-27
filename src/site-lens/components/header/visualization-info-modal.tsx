import React, {useState, useEffect} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/shared/ui/dialog';
import type {IVisualizationInfo, TTheme} from '../../types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMagnifyingGlassChart} from '@fortawesome/pro-regular-svg-icons';


interface IVisualizationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: IVisualizationInfo;
  theme?: TTheme;
}

const VisualizationInfoModal: React.FC<IVisualizationInfoModalProps> = ({
  isOpen,
  onClose,
  info,
  theme = 'dark',
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['whatItShows']),
  );

  useEffect(() => {
    if (isOpen) {
      setExpandedSections(new Set(['whatItShows']));
    }
  }, [isOpen]);

  const toggleSection = (section: string): void => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const isDark = theme === 'dark';

  const renderSection = (
    sectionKey: string,
    title: string,
    items: string[],
  ): React.ReactElement => {
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <div className={`rounded-[8px] mb-2 last:mb-0 overflow-hidden ${isDark ? 'border border-[rgba(255,255,255,0.1)]' : 'border border-[rgba(0,0,0,0.12)]'}`}>
        <button
          className={`flex items-center justify-between border-0 cursor-pointer py-[14px] px-4 text-left transition-[background-color] duration-[150ms] ease w-full ${isDark ? 'bg-[#121212] text-[#e8e8e8] hover:bg-[rgba(127,78,173,0.08)]' : 'bg-[#fafafa] text-[#1a1a1a] hover:bg-[rgba(127,78,173,0.05)]'}`}
          onClick={() => toggleSection(sectionKey)}
          aria-expanded={isExpanded}
          tabIndex={0}
        >
          <span className='text-[15px] font-medium'>{title}</span>
          <span className={`flex items-center rounded-[8px] shrink-0 h-[30px] justify-center opacity-70 transition-transform duration-200 w-[30px] ${isDark ? 'bg-[#222]' : 'bg-[#eee]'} ${isExpanded ? 'rotate-180' : ''}`}>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
              <path
                d='M4 6L8 10L12 6'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </span>
        </button>
        {isExpanded && (
          <ul className={`list-disc m-0 py-4 pl-9 pr-4 [&_li]:text-sm [&_li]:leading-[1.6] [&_li]:mb-2 [&_li:last-child]:mb-0 ${isDark ? '[&_li]:text-[#a3a4a4]' : '[&_li]:text-[#555]'}`}>
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const titleNode = (
    <div className='flex items-center gap-3'>
      <span className='flex items-center bg-[#936bda4d] rounded-full shrink-0 h-[34px] justify-center w-[34px]'>
        <FontAwesomeIcon icon={faMagnifyingGlassChart} color='#936BDA' fontSize='16px' />
      </span>
      <span>{info.title}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={open => {
      if (!open) onClose();
    }}>
      <DialogContent className={`top-[50px] translate-y-0 max-w-[600px] sm:max-w-[600px] mt-[130px] rounded-xl p-0 border ${isDark ?
        'bg-[#0a0a0a] border-[rgba(255,255,255,0.1)] text-[#e8e8e8]' :
        'bg-white border-[rgba(0,0,0,0.12)] text-[#1a1a1a]'}`}
      >
        <DialogHeader className={`rounded-t-xl m-0 px-6 py-5 border-b ${isDark ?
          'bg-[#0a0a0a] border-b-[rgba(255,255,255,0.1)]' :
          'bg-white border-b-[rgba(0,0,0,0.12)]'}`}
        >
          <DialogTitle className={`text-[18px] font-semibold ${isDark ? 'text-[#e8e8e8]' : 'text-[#1a1a1a]'}`}>
            {titleNode}
          </DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-2 px-4 py-5 max-h-[70vh] overflow-y-auto scrollbar-thin'>
          <p className={`text-[14px] leading-[1.6] m-0 mb-[10px] ${isDark ? 'text-[#a3a4a4]' : 'text-[#555]'}`}>
            {info.description}
          </p>

          {renderSection('whatItShows', 'What it Shows', info.whatItShows)}
          {renderSection('howToUse', 'How to Use', info.howToUse)}
          {renderSection('howCalculated', "How it's Calculated", info.howCalculated)}
          {renderSection('keyInsights', 'Key Insights to Look For', info.keyInsights)}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisualizationInfoModal;
