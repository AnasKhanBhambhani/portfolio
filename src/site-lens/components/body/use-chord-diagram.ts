import {useEffect, useRef, useMemo, useState, useCallback} from 'react';
import {select} from 'd3-selection';
import {arc} from 'd3-shape';
import {chord, ribbon} from 'd3-chord';
import {descending} from 'd3-array';
import type {ChordGroup, Chord, ChordSubgroup} from 'd3-chord';
import type {ITreeNode, IChordDiagramProps, ISectionData, ISelection, ILinkDetail} from '../../types';
import {SECTION_COLORS, METRICS} from '../../constants';
import {addSvgWatermark, getNodeBackendId, metricValuePassesRange} from '../../functions';
import {addEllipsis} from '@/utils/string';
import {useTooltipPositioning} from '../../hooks/use-tooltip-positioning';

export const useChordDiagram = ({
  theme,
  showWatermark = true,
  watermarkLogoUrl,
  selectedPageIds,
  filterMode = 'deemphasize',
  nodes,
  links,
  metricRanges,
  metricBounds,
}: IChordDiagramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<ISelection | null>(null);
  const [linkDetails, setLinkDetails] = useState<ILinkDetail[]>([]);
  const isDark = theme === 'dark';

  const nodePassesMetricFilters = useCallback((node: ITreeNode) => {
    if (!metricRanges || !metricBounds) return true;

    for (const metric of METRICS) {
      const value = node[metric.key] as number | null | undefined;
      if (!metricValuePassesRange(value, metricRanges[metric.key], metricBounds[metric.key])) {
        return false;
      }
    }

    return true;
  }, [metricRanges, metricBounds]);

  const isNodeFiltered = useCallback((node: ITreeNode) => {
    if (filterMode !== 'deemphasize' && filterMode !== 'remove') return false;

    let passesPageSelection = true;
    if (selectedPageIds && selectedPageIds.size > 0) {
      const nodeBackendId = getNodeBackendId(node);
      passesPageSelection = selectedPageIds.has(nodeBackendId);
    }

    const passesMetrics = nodePassesMetricFilters(node);

    return !(passesPageSelection && passesMetrics);
  }, [selectedPageIds, filterMode, nodePassesMetricFilters]);

  const filteredData = useMemo(() => {
    if (filterMode === 'deemphasize') {
      return {nodes, links};
    }

    const filteredNodes = nodes.filter(node => {
      let passesPageSelection = true;
      if (selectedPageIds && selectedPageIds.size > 0) {
        const nodeBackendId = getNodeBackendId(node);
        passesPageSelection = selectedPageIds.has(nodeBackendId);
      }

      const passesMetrics = nodePassesMetricFilters(node);

      return passesPageSelection && passesMetrics;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(
      link => filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target),
    );
    return {nodes: filteredNodes, links: filteredLinks};
  }, [nodes, links, selectedPageIds, filterMode, nodePassesMetricFilters]);

  const chordData = useMemo(() => {
    const sections = new Map<string, ISectionData>();
    const nodeMap = new Map<number, ITreeNode>();
    const nodeFilteredMap = new Map<number, boolean>();

    filteredData.nodes.forEach(node => {
      nodeMap.set(node.id, node);
      if (filterMode === 'deemphasize') {
        nodeFilteredMap.set(node.id, isNodeFiltered(node));
      }
    });

    filteredData.nodes.forEach(node => {
      try {
        const url = new URL(node.url);
        const pathParts = url.pathname.split('/').filter(p => p);
        const sectionName = pathParts[0] || 'home';

        if (!sections.has(sectionName)) {
          const colorIndex = sections.size % (SECTION_COLORS?.length || 1);
          const sectionColor = SECTION_COLORS?.[colorIndex] || '#667085';
          sections.set(sectionName, {
            name: sectionName,
            nodeIds: new Set(),
            nodes: [],
            color: sectionColor,
            totalTraffic: 0,
            totalLinks: 0,
          });
        }
        const section = sections.get(sectionName)!;
        section.nodeIds.add(node.id);
        section.nodes.push(node);
        section.totalTraffic += node.traffic || 0;
      } catch {
        if (!sections.has('other')) {
          sections.set('other', {
            name: 'other',
            nodeIds: new Set(),
            nodes: [],
            color: '#667085',
            totalTraffic: 0,
            totalLinks: 0,
          });
        }
        const section = sections.get('other')!;
        section.nodeIds.add(node.id);
        section.nodes.push(node);
        section.totalTraffic += node.traffic || 0;
      }
    });

    const sectionArray = Array.from(sections.values());
    const nodeToSection = new Map<number, number>();
    sectionArray.forEach((section, index) => {
      section.nodeIds.forEach(nodeId => {
        nodeToSection.set(nodeId, index);
      });
    });

    const n = sectionArray.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const linksBySection: Map<string, ILinkDetail[]> = new Map();

    filteredData.links.forEach(link => {
      const sourceSection = nodeToSection.get(link.source);
      const targetSection = nodeToSection.get(link.target);

      if (sourceSection !== undefined && targetSection !== undefined) {
        matrix[sourceSection][targetSection]++;
        sectionArray[sourceSection].totalLinks++;

        const key = `${sourceSection}-${targetSection}`;
        if (!linksBySection.has(key)) {
          linksBySection.set(key, []);
        }
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);
        if (sourceNode && targetNode) {
          linksBySection.get(key)!.push({
            sourceUrl: sourceNode.url,
            targetUrl: targetNode.url,
          });
        }

        if (sourceSection !== targetSection) {
          matrix[targetSection][sourceSection]++;
        }
      }
    });

    // Diagonal cells (matrix[i][i]) reflect real self-section links only — no synthetic
    // fill. A section with zero real internal links renders with no self-loop.

    return {sections: sectionArray, matrix, nodeToSection, linksBySection, nodeFilteredMap};
  }, [filteredData, filterMode, isNodeFiltered]);

  const getLinksForSelection = useCallback((sourceIndex: number, targetIndex: number) => {
    const key = `${sourceIndex}-${targetIndex}`;
    const linksData = chordData.linksBySection.get(key) || [];
    const reverseKey = `${targetIndex}-${sourceIndex}`;
    const reverseLinks = chordData.linksBySection.get(reverseKey) || [];
    return [...linksData, ...reverseLinks].slice(0, 50);
  }, [chordData]);

  const handleGroupClick = useCallback((index: number) => {
    if (selection?.type === 'group' && selection.groupIndex === index) {
      setSelection(null);
      setLinkDetails([]);
    } else {
      setSelection({type: 'group', groupIndex: index});
      setLinkDetails([]);
    }
  }, [selection]);

  const handleRibbonClick = useCallback((sourceIndex: number, targetIndex: number) => {
    if (selection?.type === 'ribbon' &&
        selection.sourceIndex === sourceIndex &&
        selection.targetIndex === targetIndex) {
      setSelection(null);
      setLinkDetails([]);
    } else {
      setSelection({type: 'ribbon', sourceIndex, targetIndex});
      setLinkDetails(getLinksForSelection(sourceIndex, targetIndex));
    }
  }, [selection, getLinksForSelection]);

  const handleBackgroundClick = useCallback(() => {
    setSelection(null);
    setLinkDetails([]);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    if (chordData.sections.length === 0) return;

    const container = containerRef.current;
    const panelWidth = selection ? 320 : 0;
    const width = container.clientWidth - panelWidth;
    const height = container.clientHeight;
    const outerRadius = Math.min(width, height) * 0.38;
    const innerRadius = outerRadius - 25;

    select(svgRef.current).selectAll('*').remove();

    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    if (showWatermark) {
      addSvgWatermark(svg, width, height, theme, watermarkLogoUrl);
    }

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('click', handleBackgroundClick);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const chordGenerator = chord()
      .padAngle(0.05)
      .sortSubgroups(descending);

    const chords = chordGenerator(chordData.matrix);

    const arcGenerator = arc<ChordGroup>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbonGenerator = ribbon<Chord, ChordSubgroup>()
      .radius(innerRadius);

    const existingTooltip = select(container).select('.chord-tooltip');
    existingTooltip.remove();

    const tooltipClass = [
      'chord-tooltip absolute',
      isDark ? 'bg-[#333] text-white' : 'bg-white text-[#333]',
      'px-3 py-2 rounded text-xs',
      'shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
      'pointer-events-none z-[1000]',
    ].join(' ');

    const tooltip = select(container)
      .append('div')
      .attr('class', tooltipClass)
      .style('visibility', 'hidden');

    const isGroupSelected = (index: number) => {
      if (!selection) return true;
      if (selection.type === 'group') return selection.groupIndex === index;
      if (selection.type === 'ribbon') {
        return selection.sourceIndex === index || selection.targetIndex === index;
      }
      return true;
    };

    const isRibbonSelected = (sourceIndex: number, targetIndex: number) => {
      if (!selection) return true;
      if (selection.type === 'group') {
        return selection.groupIndex === sourceIndex || selection.groupIndex === targetIndex;
      }
      if (selection.type === 'ribbon') {
        return (selection.sourceIndex === sourceIndex && selection.targetIndex === targetIndex) ||
               (selection.sourceIndex === targetIndex && selection.targetIndex === sourceIndex);
      }
      return true;
    };

    const group = g.append('g')
      .attr('class', 'groups')
      .selectAll('g')
      .data(chords.groups)
      .join('g');

    group.append('path')
      .attr('fill', d => chordData.sections[d.index].color)
      .attr('stroke', isDark ? '#24262A' : '#ffffff')
      .attr('stroke-width', 2)
      .attr('d', arcGenerator)
      .style('cursor', 'pointer')
      .style('opacity', d => {
        if (filterMode === 'deemphasize') {
          const section = chordData.sections[d.index];
          const hasFilteredNodes = section.nodeIds.size > 0 &&
            Array.from(section.nodeIds).some(nodeId => chordData.nodeFilteredMap?.get(nodeId));
          if (hasFilteredNodes) return 0.2;
        }
        return isGroupSelected(d.index) ? 1 : 0.3;
      })
      .on('mouseover', function(event, d) {
        if (selection) return;

        g.selectAll('.ribbons path')
          .style('opacity', (r: any) =>
            r.source.index === d.index || r.target.index === d.index ? 0.9 : 0.1,
          );

        const section = chordData.sections[d.index];
        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${section.name}</strong><br/>
            Pages: ${section.nodeIds.size}<br/>
            Traffic: ${section.totalTraffic.toLocaleString()}<br/>
            <em>Click to select</em>
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.offsetY - 10) + 'px')
          .style('left', (event.offsetX + 10) + 'px');
      })
      .on('mouseout', function() {
        if (selection) return;
        g.selectAll('.ribbons path').style('opacity', 0.7);
        tooltip.style('visibility', 'hidden');
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        handleGroupClick(d.index);
        tooltip.style('visibility', 'hidden');
      });

    group.append('text')
      .each(d => {
        (d as any).angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '0.35em')
      .attr('transform', d => {
        const angle = ((d as any).angle * 180 / Math.PI - 90);
        const flip = (d as any).angle > Math.PI;
        return `
          rotate(${angle})
          translate(${outerRadius + 10})
          ${flip ? 'rotate(180)' : ''}
        `;
      })
      .attr('text-anchor', d => (d as any).angle > Math.PI ? 'end' : 'start')
      .style('font-size', '11px')
      .style('font-weight', d => isGroupSelected(d.index) ? '600' : '400')
      .style('fill', d => isGroupSelected(d.index) ?
        (isDark ? '#E8E8E8' : '#333333') :
        (isDark ? '#666' : '#999'))
      .style('cursor', 'pointer')
      .text(d => addEllipsis(chordData.sections[d.index].name, 8))
      .on('mouseover', function(event, d) {
        const sectionName = chordData.sections[d.index].name;
        if (sectionName.length > 8) {
          tooltip
            .style('visibility', 'visible')
            .html(`<strong>${sectionName}</strong>`);
        }
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.offsetY - 10) + 'px')
          .style('left', (event.offsetX + 10) + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('visibility', 'hidden');
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        handleGroupClick(d.index);
        tooltip.style('visibility', 'hidden');
      });

    g.append('g')
      .attr('class', 'ribbons')
      .selectAll('path')
      .data(chords)
      .join('path')
      .attr('d', ribbonGenerator)
      .attr('fill', d => chordData.sections[d.source.index].color)
      .attr('stroke', 'none')
      .style('opacity', d => {
        if (filterMode === 'deemphasize') {
          const sourceSection = chordData.sections[d.source.index];
          const targetSection = chordData.sections[d.target.index];
          const sourceFiltered = Array.from(sourceSection.nodeIds).some(nodeId => chordData.nodeFilteredMap?.get(nodeId));
          const targetFiltered = Array.from(targetSection.nodeIds).some(nodeId => chordData.nodeFilteredMap?.get(nodeId));
          if (sourceFiltered || targetFiltered) {
            return isRibbonSelected(d.source.index, d.target.index) ? 0.2 : 0.05;
          }
        }
        return isRibbonSelected(d.source.index, d.target.index) ? 0.7 : 0.1;
      })
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        if (selection) return;
        select(event.currentTarget as SVGPathElement).style('opacity', 0.95);

        const source = chordData.sections[d.source.index];
        const target = chordData.sections[d.target.index];
        const linkCount = chordData.matrix[d.source.index][d.target.index];

        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${source.name}</strong> ↔ <strong>${target.name}</strong><br/>
            Links: ${linkCount}<br/>
            <em>Click for details</em>
          `);
      })
      .on('mousemove', event => {
        tooltip
          .style('top', (event.offsetY - 10) + 'px')
          .style('left', (event.offsetX + 10) + 'px');
      })
      .on('mouseout', event => {
        if (selection) return;
        select(event.currentTarget as SVGPathElement).style('opacity', 0.7);
        tooltip.style('visibility', 'hidden');
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        handleRibbonClick(d.source.index, d.target.index);
        tooltip.style('visibility', 'hidden');
      });

    return () => {
      tooltip.remove();
    };
  }, [chordData, theme, selection, showWatermark, watermarkLogoUrl, filterMode, handleBackgroundClick, handleGroupClick, handleRibbonClick]);

  useTooltipPositioning();

  const selectedSection = selection?.type === 'group' && selection.groupIndex !== undefined ?
    chordData.sections[selection.groupIndex] :
    null;

  const selectedRibbon = selection?.type === 'ribbon' &&
    selection.sourceIndex !== undefined &&
    selection.targetIndex !== undefined ?
    {
      source: chordData.sections[selection.sourceIndex],
      target: chordData.sections[selection.targetIndex],
      linkCount: chordData.matrix[selection.sourceIndex][selection.targetIndex],
    } :
    null;

  const borderColor = isDark ? '#4E5156' : '#e0e0e0';
  const textClass = isDark ? 'text-[#E8E8E8]' : 'text-[#333]';
  const subtextClass = isDark ? 'text-[#888]' : 'text-[#666]';
  const listBgClass = isDark ? 'bg-[#24262A]' : 'bg-[#f5f5f5]';

  return {
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
  };
};
