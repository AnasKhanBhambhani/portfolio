import React, {useEffect, useRef, useState, useCallback} from 'react';
import {select} from 'd3-selection';
import {interpolate} from 'd3-interpolate';
import {scaleSqrt} from 'd3-scale';
import cloud from 'd3-cloud';
import type {WordCloudModalProps, CloudWord} from '../../../../types';
import {addSvgWatermark} from '../../../../functions';

const WordCloudModal: React.FC<WordCloudModalProps> = ({isOpen, onClose, topic, theme, watermarkLogoUrl}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({width: 600, height: 400});
  const isDark = theme === 'dark';

  useEffect(() => {
    const updateDimensions = () => {
      const width = Math.min(800, window.innerWidth - 80);
      const height = Math.min(500, window.innerHeight - 200);
      setDimensions({width, height});
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const drawWordCloud = useCallback((words: CloudWord[]) => {
    if (!svgRef.current || !topic || !words || words.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    addSvgWatermark(svg, dimensions.width, dimensions.height, theme, watermarkLogoUrl);

    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.height / 2})`);

    const maxWeight = Math.max(...words.map(w => w.weight));

    const colorScale = (weight: number): string => {
      const ratio = weight / maxWeight;
      if (ratio > 0.6) {
        return topic.color || '#7F56D9';
      } else if (ratio > 0.3) {
        return interpolate(isDark ? '#888888' : '#666666', topic.color || '#7F56D9')(ratio);
      } else {
        return isDark ? '#666666' : '#999999';
      }
    };

    g.selectAll('text')
      .data(words)
      .enter()
      .append('text')
      .style('font-size', d => `${d.size}px`)
      .style('font-family', 'Manrope, Arial, sans-serif')
      .style('font-weight', d => d.weight / maxWeight > 0.5 ? 'bold' : 'normal')
      .style('fill', d => colorScale(d.weight))
      .attr('text-anchor', 'middle')
      .attr('transform', d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
      .text(d => d.text)
      .style('cursor', 'default')
      .on('mouseover', function(this: SVGTextElement) {
        select(this) // eslint-disable-line no-invalid-this
          .transition()
          .duration(200)
          .style('opacity', 0.7);
      })
      .on('mouseout', function(this: SVGTextElement) {
        select(this) // eslint-disable-line no-invalid-this
          .transition()
          .duration(200)
          .style('opacity', 1);
      });
  }, [topic, theme, isDark, dimensions]);

  useEffect(() => {
    if (!isOpen || !topic || !topic.keywordWeights || topic.keywordWeights.length === 0) return;

    const validKeywords = topic.keywordWeights.filter(k => k && k.word && k.weight > 0);

    if (validKeywords.length === 0) return;

    const maxWeight = Math.max(...validKeywords.map(k => k.weight));

    const fontScale = scaleSqrt()
      .domain([1, maxWeight])
      .range([14, 56]);

    const words: CloudWord[] = validKeywords.map(k => ({
      text: k.word,
      size: fontScale(k.weight),
      weight: k.weight,
    }));

    const layout = cloud<CloudWord>()
      .size([dimensions.width, dimensions.height])
      .words(words)
      .padding(5)
      .rotate(() => {
        const rand = Math.random();
        if (rand < 0.6) return 0;
        if (rand < 0.8) return 90;
        return -90;
      })
      .fontSize(d => d.size || 14)
      .spiral('archimedean')
      .on('end', drawWordCloud);

    layout.start();
  }, [isOpen, topic, dimensions, drawWordCloud]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !topic) return null;

  const hasKeywords = topic.keywordWeights && topic.keywordWeights.length > 0;
  const subtextClass = isDark ? 'text-[#888]' : 'text-[#666]';

  const closeBtnClass = [
    'bg-none border-0 rounded cursor-pointer text-2xl px-2 py-1 transition-all duration-200',
    isDark ?
      'text-[#888] hover:bg-[#3a3b3f] hover:text-[#e8e8e8]' :
      'text-[#666] hover:bg-[#f0f0f0] hover:text-[#333]',
  ].join(' ');

  return (
    <div
      className={`items-center inset-0 flex justify-center fixed z-[1000] ${isDark ?
        'bg-[rgba(0,0,0,0.8)]' :
        'bg-[rgba(0,0,0,0.5)]'}`}
      onClick={onClose}
    >
      <div
        className={`rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-h-[90vh] max-w-[90vw] overflow-hidden p-6 ${isDark ?
          'bg-[#24262a]' :
          'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className='items-center flex justify-between mb-4'>
          <div className='items-center flex gap-3'>
            <div
              className='rounded-full h-4 w-4'
              style={{background: topic?.color}}
            />
            <h2 className={`text-xl font-semibold m-0 ${isDark ? 'text-[#e8e8e8]' : 'text-[#333]'}`}>
              {topic?.name}
            </h2>
            <span className={`text-sm ${subtextClass}`}>
              Word Cloud
            </span>
          </div>
          <button
            onClick={onClose}
            className={closeBtnClass}
          >
            &times;
          </button>
        </div>

        <div
          className={`border border-solid rounded-lg overflow-hidden relative ${isDark ?
            'bg-[#1a1b1f] border-[#4e5156]' :
            'bg-[#fafafa] border-[#e0e0e0]'}`}
        >
          {!hasKeywords && (
            <div className={`text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${subtextClass}`}>
              No keywords available for this topic
            </div>
          )}
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{display: 'block'}}
          />
        </div>

        <div className={`flex text-xs justify-between mt-3 ${subtextClass}`}>
          <span>
            {hasKeywords ?
              `${topic.keywordWeights.length} keywords` :
              'No keywords available'}
          </span>
          <span>Click outside or press ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default WordCloudModal;
