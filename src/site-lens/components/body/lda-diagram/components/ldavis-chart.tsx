import React, {useEffect, useRef, useMemo, useState} from 'react';
import {select} from 'd3-selection';
import {Delaunay} from 'd3-delaunay';
import {scaleSqrt} from 'd3-scale';
import type {LDAvisProps, Topic} from '../../../../types';
import {CLUSTER_COLORS} from '../../../../constants';
import {getClusterColor, extractTopicsWithTerms, calculateRelevance, positionTopics} from '../../../../functions';
import {scrollableBase, scrollableDark, scrollableLight} from './lda-chart-tailwind';

const LDAvis: React.FC<LDAvisProps> = ({data, settings}) => {
  const leftPanelRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({width: 1000, height: 600});
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null);
  const [lambda, setLambda] = useState(0.6);
  const [numTerms, setNumTerms] = useState(30);
  const [numClusters, setNumClusters] = useState(6);
  const isDark = settings.theme === 'dark';

  // D3 rendering colors
  const colors = useMemo(() => ({
    text: isDark ? '#E8E8E8' : '#333333',
    subtext: isDark ? '#888' : '#666',
  }), [isDark]);

  const textClass = isDark ? 'text-[#e8e8e8]' : 'text-[#333]';
  const subtextClass = isDark ? 'text-[#888]' : 'text-[#666]';
  const scrollableTheme = isDark ? scrollableDark : scrollableLight;

  const topics = useMemo(() => {
    const extracted = extractTopicsWithTerms(data.nodes, numClusters);
    const positioned = positionTopics(extracted, dimensions.width * 0.55, dimensions.height - 120);
    if (settings.isNodeFiltered) {
      return positioned.map(topic => ({
        ...topic,
        hasFilteredNodes: topic.nodes.some(n => settings.isNodeFiltered!(n)),
      }));
    }
    return positioned;
  }, [data.nodes, numClusters, dimensions, settings.isNodeFiltered]);

  const activeTopic = selectedTopic || hoveredTopic || (topics.length > 0 ? topics[0] : null);

  const sortedTerms = useMemo(() => {
    if (!activeTopic) return [];
    const maxTopicFreq = Math.max(...activeTopic?.terms?.map(t => t?.topicFreq) || []);
    const maxCorpusFreq = Math.max(...activeTopic?.terms?.map(t => t?.corpusFreq) || []);

    return activeTopic?.terms
      ?.map(term => ({
        ...term,
        relevance: calculateRelevance(term, lambda, maxTopicFreq, maxCorpusFreq),
      }))
      ?.sort((a, b) => b?.relevance! - a?.relevance!)
      ?.slice(0, numTerms);
  }, [activeTopic, lambda, numTerms]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const {width, height} = containerRef.current.getBoundingClientRect();
        setDimensions({width, height: Math.max(height, 500)});
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!leftPanelRef.current || topics.length === 0) return;

    const svg = select(leftPanelRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width * 0.55;
    const height = dimensions.height - 120;

    const voronoi = Delaunay.from(topics, d => d.x!, d => d.y!).voronoi([0, 0, width, height]);

    const regionsGroup = svg.append('g').attr('class', 'regions');
    topics?.forEach((topic, i) => {
      const cell = voronoi.cellPolygon(i);
      if (cell) {
        const pathData = cell.map(point => point as [number, number]);
        regionsGroup.append('path')
          .attr('d', `M${pathData?.map(p => p.join(',')).join('L')}Z`)
          .attr('fill', CLUSTER_COLORS[i % CLUSTER_COLORS.length]?.bg)
          .attr('stroke', CLUSTER_COLORS[i % CLUSTER_COLORS.length]?.border)
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.3);
      }
    });

    const circleGroup = svg.append('g').attr('class', 'circles');

    const radiusScale = scaleSqrt()
      .domain([0, Math?.max(...topics?.map(t => t?.weight) || [])])
      .range([15, 60]);

    const circles = circleGroup.selectAll('.topic-circle')
      .data(topics)
      .enter()
      .append('g')
      .attr('class', 'topic-circle')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer');

    circles.append('circle')
      .attr('r', d => radiusScale(d.weight))
      .attr('fill', (_d, i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length]?.bg || '#4CAF50')
      .attr('stroke', (_d, i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length]?.border || '#4CAF50')
      .attr('stroke-width', 2)
      .attr('opacity', d => {
        if (settings.filterMode === 'deemphasize' && (d as any).hasFilteredNodes) {
          return 0.2;
        }
        return 1;
      });

    circles.append('circle')
      .attr('r', d => radiusScale(d.weight) * 0.6)
      .attr('fill', (_d, i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length]?.border || '#4CAF50')
      .attr('fill-opacity', d => {
        if (settings.filterMode === 'deemphasize' && (d as any).hasFilteredNodes) {
          return 0.2;
        }
        return (selectedTopic?.id === d.id || hoveredTopic?.id === d.id) ? 0.8 : 0.4;
      });

    circles.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', colors.text)
      .attr('font-size', d => Math.max(10, radiusScale(d.weight) / 3))
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => d.id);

    circles
      .on('mouseenter', function(this: SVGGElement) {
        const d = select(this).datum() as Topic; // eslint-disable-line no-invalid-this
        if (!d || !d.id) return;

        select(this).select('circle:nth-child(2)') // eslint-disable-line no-invalid-this
          .transition()
          .duration(150)
          .attr('fill-opacity', 0.8);
        setHoveredTopic(d);
      })
      .on('mouseleave', function(this: SVGGElement) {
        const d = select(this).datum() as Topic; // eslint-disable-line no-invalid-this

        select(this).select('circle:nth-child(2)') // eslint-disable-line no-invalid-this
          .transition()
          .duration(150)
          .attr('fill-opacity', selectedTopic?.id === d?.id ? 0.8 : 0.4);
        setHoveredTopic(null);
      })
      .on('click', function(this: SVGGElement) {
        const d = select(this).datum() as Topic; // eslint-disable-line no-invalid-this
        if (!d || !d.id) return;

        setSelectedTopic(prev => (prev?.id === d.id ? null : d));
      });

    const div = svg.append('foreignObject')
      .attr('width', width)
      .attr('height', 50)
      .style('overflow', 'visible')
      .append('xhtml:div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('flex-wrap', 'wrap')
      .style('gap', '4px')
      .style('padding', '4px 10px')
      .style('font-size', '11px')
      .style('color', colors.subtext);

    div.append('xhtml:span')
      .text('Click elements below to freeze selection.');

    div.append('xhtml:span')
      .style('cursor', 'pointer')
      .style('text-decoration', 'underline')
      .text('Click here to clear selection')
      .on('click', () => setSelectedTopic(null));
  }, [topics, dimensions, selectedTopic, hoveredTopic, colors, settings.filterMode]);

  const maxFreq = useMemo(() => {
    if (sortedTerms?.length === 0) return 1;
    return Math.max(...sortedTerms?.map(t => Math.max(t?.topicFreq, t?.corpusFreq)) || []);
  }, [sortedTerms]);

  const barChartWidth = dimensions.width * 0.4;

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 flex-col min-h-[500px] w-full ${isDark ? 'bg-[#1a1b1f]' : 'bg-white'}`}
    >
      <div
        className={`items-center border-b flex flex-wrap gap-6 px-5 py-3 ${isDark ?
          'border-b-[#4e5156]' :
          'border-b-[#e0e0e0]'}`}
      >
        <div className='flex flex-col gap-1'>
          <label className={`text-[11px] ${subtextClass}`}>Number of clusters</label>
          <div className='items-center flex gap-2'>
            <input
              type='range'
              min={3}
              max={10}
              value={numClusters}
              onChange={e => setNumClusters(Number(e.target.value))}
              className='w-[100px]'
            />
            <span className={`text-xs min-w-[20px] ${textClass}`}>{numClusters}</span>
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <label className={`text-[11px] ${subtextClass}`}>Number of terms</label>
          <div className='items-center flex gap-2'>
            <input
              type='range'
              min={10}
              max={50}
              value={numTerms}
              onChange={e => setNumTerms(Number(e.target.value))}
              className='w-[100px]'
            />
            <span className={`text-xs min-w-[20px] ${textClass}`}>{numTerms}</span>
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <label className={`text-[11px] ${subtextClass}`}>Value of lambda (&lambda;)</label>
          <div className='items-center flex gap-2'>
            <span className={`text-[10px] ${subtextClass}`}>0</span>
            <input
              type='range'
              min={0}
              max={1}
              step={0.1}
              value={lambda}
              onChange={e => setLambda(Number(e.target.value))}
              className='w-[100px]'
            />
            <span className={`text-[10px] ${subtextClass}`}>1</span>
            <span className={`text-xs min-w-[20px] ${textClass}`}>{lambda.toFixed(1)}</span>
          </div>
        </div>

        <div className={`text-xs ml-auto ${subtextClass}`}>
          Positioning: similarity-based layout
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        <div className={`border-r flex-[0_0_55%] ${isDark ? 'border-r-[#4e5156]' : 'border-r-[#e0e0e0]'}`}>
          <svg
            ref={leftPanelRef}
            width={dimensions.width * 0.55}
            height={dimensions.height - 120}
            style={{display: 'block'}}
          />
        </div>

        <div className={`flex-[0_0_45%] px-5 py-2.5 ${scrollableBase} ${scrollableTheme}`}>
          {activeTopic && (
            <>
              <div
                className='text-[13px] font-medium mb-4'
                style={{color: getClusterColor(activeTopic.id).border}}
              >
                {(activeTopic.weight * 100).toFixed(1)}% of the corpus comes from cluster {activeTopic.id}
                <span className={`font-normal ml-2 ${subtextClass}`}>
                  ({activeTopic.name})
                </span>
              </div>

              <div className='flex justify-end mb-2'>
                <div className={`flex text-[10px] justify-between ${subtextClass}`} style={{width: barChartWidth}}>
                  <span>0</span>
                  <span>{Math.round(maxFreq / 4)}</span>
                  <span>{Math.round(maxFreq / 2)}</span>
                  <span>{Math.round(maxFreq * 3 / 4)}</span>
                  <span>{maxFreq}</span>
                </div>
              </div>

              <div className={`max-h-[346px] pr-1 relative ${scrollableBase} ${scrollableTheme}`}>
                {sortedTerms?.map(term => (
                  <div key={term.term} className='items-center flex h-4 mb-1'>
                    <div
                      className={`text-[11px] overflow-hidden pr-2 text-right text-ellipsis whitespace-nowrap w-[100px] ${textClass}`}
                    >
                      {term.term}
                    </div>

                    <div className='h-4 relative' style={{width: barChartWidth}}>
                      <div
                        className='bg-[#d4d4d4] rounded-sm h-4 left-0 absolute top-0'
                        style={{width: `${(term.corpusFreq / maxFreq) * 100}%`}}
                      />
                      <div
                        className='bg-[#6e99d4] rounded-sm h-4 left-0 absolute top-0'
                        style={{width: `${(term.topicFreq / maxFreq) * 100}%`}}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={`flex text-[11px] gap-5 mt-4 ${subtextClass}`}>
                <div className='items-center flex gap-1.5'>
                  <div className='rounded-sm h-2.5 w-4 bg-[#6e99d4]' />
                  <span>Topic term frequency</span>
                </div>
                <div className='items-center flex gap-1.5'>
                  <div className='rounded-sm h-2.5 w-4 bg-[#d4d4d4]' />
                  <span>Corpus term frequency</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LDAvis;
