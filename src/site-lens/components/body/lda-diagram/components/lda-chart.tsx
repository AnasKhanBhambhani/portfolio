import React, {useEffect, useRef, useMemo, useState} from 'react';
import {forceSimulation, forceCenter, forceManyBody, forceCollide} from 'd3-force';
import {scaleSqrt} from 'd3-scale';
import {drag as d3Drag} from 'd3-drag';
import type {SimulationNodeDatum} from 'd3-force';
import {select} from 'd3-selection';
import type {LDADiagramProps, Topic} from '../../../../types';
import {addSvgWatermark} from '../../../../functions';
import WordCloudModal from './word-cloud-modal';
import LDASidePanel from './lda-side-panel';
import {extractTopics} from './lda-chart-utils';

const LDADiagram: React.FC<LDADiagramProps> = ({data, settings}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({width: 800, height: 600});
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showWordCloud, setShowWordCloud] = useState(false);
  const [wordCloudTopic, setWordCloudTopic] = useState<Topic | null>(null);
  const isDark = settings.theme === 'dark';

  const topics = useMemo(() => extractTopics(data.nodes, settings.numTopics || 8, settings.isNodeFiltered), [data.nodes, settings.numTopics, settings.isNodeFiltered]);

  const titleColor = isDark ? '#E8E8E8' : '#333333';

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
    if (!svgRef.current || topics.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const svgWidth = dimensions.width - 280;
    const {height} = dimensions;

    if (settings.showWatermark !== false) {
      addSvgWatermark(svg, svgWidth, height, settings.theme, settings.watermarkLogoUrl);
    }

    const margin = {top: 60, right: 40, bottom: 40, left: 40};
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const maxNodes = Math.max(...topics.map(t => t.nodes.length));
    const radiusScale = scaleSqrt()
      .domain([0, maxNodes])
      .range([30, Math.min(innerWidth, innerHeight) / 4]);

    const simulation = forceSimulation<Topic & SimulationNodeDatum>(topics as any)
      .force('center', forceCenter(innerWidth / 2, innerHeight / 2))
      .force('charge', forceManyBody().strength(50))
      .force('collision', forceCollide<Topic & SimulationNodeDatum>()
        .radius(d => radiusScale(d.weight) + 10)
        .strength(0.8),
      );

    const openWordCloudFor = (d: Topic) => {
      setSelectedTopic(prev => (prev?.id === d.id ? null : d));
      setWordCloudTopic(d);
      setShowWordCloud(true);
    };

    const bubbles = g.append('g').attr('class', 'bubbles').selectAll('.topic-bubble')
      .data(topics)
      .enter()
      .append('g')
      .attr('class', 'topic-bubble')
      .style('cursor', 'pointer');

    bubbles.append('circle')
      .attr('r', d => radiusScale(d.weight))
      .attr('fill', d => d.color)
      .attr('fill-opacity', d => {
        if (settings.filterMode === 'deemphasize' && (d as any).hasFilteredNodes) {
          return 0.2;
        }
        return 0.7;
      })
      .attr('stroke', d => d.color)
      .attr('stroke-width', 3)
      .attr('stroke-opacity', d => {
        if (settings.filterMode === 'deemphasize' && (d as any).hasFilteredNodes) {
          return 0.3;
        }
        return 0.9;
      })
      .on('mouseover', function(this: SVGCircleElement) {
        const d = select(this).datum() as Topic; // eslint-disable-line no-invalid-this
        select(this) // eslint-disable-line no-invalid-this
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.9);
        setHoveredTopic(d);
      })
      .on('mouseout', function(this: SVGCircleElement) {
        select(this) // eslint-disable-line no-invalid-this
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.7);
        setHoveredTopic(null);
      })
      .on('click', function(this: SVGCircleElement) {
        openWordCloudFor(select(this).datum() as Topic); // eslint-disable-line no-invalid-this
      });

    const labels = g.append('g').attr('class', 'labels')
      .selectAll('.topic-label').data(topics).enter()
      .append('g').attr('class', 'topic-label').style('pointer-events', 'auto').style('cursor', 'pointer')
      .on('click', (_, d: Topic) => openWordCloudFor(d));

    labels.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('fill', '#fff')
      .attr('font-size', d => Math.max(8, radiusScale(d.weight) / 5))
      .attr('font-weight', 'bold')
      .text(d => {
        const maxChars = Math.floor(radiusScale(d.weight) / 7);
        return d.name.length > maxChars ? d.name.slice(0, maxChars - 1) + '…' : d.name;
      })
      .append('title')
      .text(d => {
        const maxChars = Math.floor(radiusScale(d.weight) / 7);
        return d.name.length > maxChars ? d.name : '';
      });

    labels.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('fill', '#fff')
      .attr('font-size', d => Math.max(10, radiusScale(d.weight) / 5))
      .text(d => `${d.nodes.length} pages`);

    simulation.on('tick', () => {
      bubbles.attr('transform', (d: any) => {
        const r = radiusScale(d.weight);
        d.x = Math.max(r, Math.min(innerWidth - r, d.x || innerWidth / 2));
        d.y = Math.max(r, Math.min(innerHeight - r, d.y || innerHeight / 2));
        return `translate(${d.x}, ${d.y})`;
      });
      labels.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    svg.append('text')
      .attr('x', svgWidth / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', titleColor)
      .attr('font-size', 18)
      .attr('font-weight', 'bold')
      .text('Topic Distribution (LDA Visualization)');

    const dragBehavior = d3Drag<SVGGElement, Topic>()
      .on('start', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    bubbles.call(dragBehavior as any);
    labels.call(dragBehavior as any);

    return () => {
      simulation.stop();
    };
  }, [topics, dimensions, titleColor, settings.showWatermark, settings.theme, settings.watermarkLogoUrl, settings.filterMode]);

  const handleOpenWordCloud = (topic: Topic) => {
    setWordCloudTopic(topic);
    setShowWordCloud(true);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 relative w-full ${isDark ? 'bg-[#24262a]' : 'bg-[#f5f5f5]'}`}
    >
      <div className='flex-1 relative'>
        <svg
          ref={svgRef}
          width={dimensions.width - 280}
          height={dimensions.height}
          style={{display: 'block'}}
        />
      </div>

      <LDASidePanel
        topics={topics}
        selectedTopic={selectedTopic}
        hoveredTopic={hoveredTopic}
        isDark={isDark}
        setSelectedTopic={setSelectedTopic}
        onOpenWordCloud={handleOpenWordCloud}
      />

      <WordCloudModal
        isOpen={showWordCloud}
        onClose={() => setShowWordCloud(false)}
        topic={wordCloudTopic}
        theme={settings.theme}
        watermarkLogoUrl={settings.watermarkLogoUrl}
      />
    </div>
  );
};

export default LDADiagram;
