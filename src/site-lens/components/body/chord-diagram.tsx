import React from 'react';
import type {IChordDiagramProps} from '../../types';
import {useChordDiagram} from './use-chord-diagram';
import {ChordDetailPanel} from './chord-detail-panel';

export const ChordDiagram: React.FC<IChordDiagramProps> = props => {
  const {
    svgRef,
    containerRef,
    selection,
    linkDetails,
    isDark,
    chordData,
    selectedSection,
    selectedRibbon,
    borderColor,
    textClass,
    subtextClass,
    listBgClass,
    handleBackgroundClick,
  } = useChordDiagram(props);

  if (chordData.sections.length === 0) {
    return (
      <div className='flex items-center text-[#888] text-sm justify-center min-h-[500px] w-full'>
        <p>No data available to display chord diagram</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-lg flex flex-1 min-h-[500px] relative w-full ${isDark ? 'bg-[#24262A]' : 'bg-[#f5f5f5]'}`}
    >
      <svg ref={svgRef} className='flex-1 h-full' />

      {selection && (
        <ChordDetailPanel
          selectedSection={selectedSection}
          selectedRibbon={selectedRibbon}
          linkDetails={linkDetails}
          handleBackgroundClick={handleBackgroundClick}
          isDark={isDark}
          textClass={textClass}
          subtextClass={subtextClass}
          listBgClass={listBgClass}
          borderColor={borderColor}
        />
      )}
    </div>
  );
};

