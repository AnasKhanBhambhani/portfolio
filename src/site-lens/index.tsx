import {observer} from 'mobx-react-lite';
import classNames from 'classnames';
import React from 'react';
import {Loader2} from 'lucide-react';
import {SimpleTooltip} from '@/shared/ui/composed/simple-tooltip';
import {ThinkingLoader} from '@/components/common-components/components/thinking-loader';
import {linkgraphDomains} from '@/utils/router';
import ThreeDCrawlDiagram from './components/body/3d-crawl-diagram';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faXmark} from '@fortawesome/pro-regular-svg-icons';
import {faCircleCheck} from '@fortawesome/pro-solid-svg-icons';
import {VISUALIZATION_INFO, ORPHAN_STATUS_TOOLTIP} from './constants';
import {TreeDiagram} from './components/body/tree-diagram';
import {CrawlTree} from './components/body/crawl-tree';
import LdaDiagram from './components/body/lda-diagram';
import {ChordDiagram} from './components/body/chord-diagram';
import PageSelector from './components/header/filter-drawer';
import VisualizationInfoModal from './components/header/visualization-info-modal';
import {useSiteLens} from './use-site-lens';
import {SiteLensHeader} from './site-lens-header';
import {CAPTION_OVERLAY_CLASS, DIAGRAM_CONTAINER_CLASS, getCaptionALineClass, getCaptionBLineClass} from './tailwind';


export const SiteVisualization = observer(({embedded = false}: {embedded?: boolean} = {}) => {
  const {
    type,
    setType,
    theme,
    setTheme,
    showWatermark,
    setShowWatermark,
    showDisplaySettings,
    setShowDisplaySettings,
    isPageSelectorOpen,
    setIsPageSelectorOpen,
    selectedPageIds,
    setSelectedPageIds,
    filterMode,
    setFilterMode,
    metricRanges,
    setMetricRanges,
    metricBounds,
    setMetricBounds,
    infoModalOpen,
    setInfoModalOpen,
    activeVisualizationInfo,
    showPrunable,
    setShowPrunable,
    hideOrphans,
    setHideOrphans,
    ldaViewMode,
    setLdaViewMode,
    showExportToast,
    setShowExportToast,
    lastDepthNode,
    depthNodesGraph,
    loadingDepthNodes,
    watermarkLogoUrl,
    orphanCount,
    orphanNodeIds,
    filteredNodesGraph,
    handleInfoClick,
    handleExportPNG,
    isDark,
  } = useSiteLens();

  const chartStatusBarClass = `items-center flex flex-wrap gap-3.5 justify-center left-0 py-3 right-0 z-10 text-xs [&>span:first-child]:font-medium ${isDark ?
    'text-[#A7A9B4] [&>span:first-child]:text-[#6B6D7A]' :
    'text-[#4E5156] [&>span:first-child]:text-[#9E9DA1]'}`;

  const resetBtnClass = `items-center border border-solid rounded-lg cursor-pointer inline-flex h-[30px] px-4 text-[12.5px] font-semibold transition-all duration-200 ease-in-out ${isDark ?
    'bg-[#1A1B24] border-[#24262F] text-[#A7A9B4] hover:bg-[#24262F] hover:border-[#667085]' :
    'bg-white border-[#E6E6EA] text-[#4E5156] hover:bg-[#F7F7FB] hover:border-[#d0d0d6]'}`;

  const hasStatusBar = showPrunable || hideOrphans;

  const renderStatusBar = () => (
    <div className={chartStatusBarClass}>
      <span>Filter:</span>
      {showPrunable && (
        <span className='items-center flex text-xs gap-1.5'>
          <span className='border-[1.5px] border-solid rounded-full shrink-0 h-1.5 w-1.5' style={{borderColor: '#E74C3C'}} />
          Prunable highlighted
        </span>
      )}
      {hideOrphans && (
        <SimpleTooltip title={ORPHAN_STATUS_TOOLTIP}>
          <span className='items-center flex text-xs gap-1.5'>
            <span className='border-[1.5px] border-solid rounded-full shrink-0 h-1.5 w-1.5' style={{backgroundColor: '#667085'}} />
            Orphans hidden ({orphanCount})
          </span>
        </SimpleTooltip>
      )}
      <button
        className={resetBtnClass}
        onClick={() => {
          setShowPrunable(false);
          setHideOrphans(false);
        }}
        aria-label='Reset Filters'
      >
        Reset
      </button>
    </div>
  );

  // Theme-driven full-viewport backdrop. The page sizes itself to
  // `100vh - --chrome-height`, which sits a hair above 100vh once fractional
  // chrome heights round up — that few-px scroll would otherwise expose the
  // global light `body { background:#f2f2f5 }` beneath the dark canvas. This
  // fixed layer paints the whole viewport in the current theme colour (behind
  // all content, non-interactive), so any scroll gap matches the canvas.
  // When `embedded`, the whole thing is scoped to its own box (absolute
  // backdrop + h-full) so it can live inline inside the scrolling portfolio;
  // as a standalone route it paints the full viewport (fixed backdrop + 100vh).
  const bgClass = isDark ? 'bg-black' : 'bg-[rgb(242,242,245)]';
  const backdropClass = `${embedded ? 'absolute' : 'fixed'} inset-0 -z-10 pointer-events-none ${bgClass}`;

  return (
    <div className={embedded ? `relative h-full w-full overflow-hidden ${bgClass}` : 'contents'}>
      <div aria-hidden className={backdropClass} />
      <div className={`${embedded ? 'h-full pt-5' : 'h-[calc(100vh-var(--chrome-height,60px))] pt-10'} flex flex-col px-[26px] ${bgClass}`}>
        <SiteLensHeader
          type={type}
          setType={setType}
          theme={theme}
          setTheme={setTheme}
          isDark={isDark}
          loadingDepthNodes={loadingDepthNodes}
          depthNodesGraph={depthNodesGraph}
          showDisplaySettings={showDisplaySettings}
          setShowDisplaySettings={setShowDisplaySettings}
          isPageSelectorOpen={isPageSelectorOpen}
          setIsPageSelectorOpen={setIsPageSelectorOpen}
          showPrunable={showPrunable}
          setShowPrunable={setShowPrunable}
          hideOrphans={hideOrphans}
          setHideOrphans={setHideOrphans}
          showWatermark={showWatermark}
          setShowWatermark={setShowWatermark}
          orphanCount={orphanCount}
          ldaViewMode={ldaViewMode}
          setLdaViewMode={setLdaViewMode}
          handleInfoClick={handleInfoClick}
          handleExportPNG={handleExportPNG}
        />
        <div className={DIAGRAM_CONTAINER_CLASS}>
          {loadingDepthNodes ? (
            <div className='flex items-center justify-center h-full w-full'>
              {linkgraphDomains() ? (
                <ThinkingLoader width={93} height={150} />
              ) : (
                <Loader2 className='animate-spin' size={50} color='#7f4ead' />
              )}
            </div>
          ) : (
            <>
              {type === 1 && (
                <div data-container='tree-diagram' className={DIAGRAM_CONTAINER_CLASS}>
                  <TreeDiagram
                    theme={theme}
                    showWatermark={showWatermark}
                    watermarkLogoUrl={watermarkLogoUrl}
                    selectedPageIds={selectedPageIds}
                    filterMode={filterMode}
                    showPrunable={showPrunable}
                    hideOrphans={hideOrphans}
                    orphanNodeIds={orphanNodeIds}
                    metricRanges={metricRanges}
                    metricBounds={metricBounds}
                  />
                  <div className={CAPTION_OVERLAY_CLASS}>
                    <div className={getCaptionBLineClass(isDark)}>Scroll to zoom, drag to move.</div>
                  </div>
                </div>
              )}
              {type === 6 && lastDepthNode && (
                <div data-container='crawl-tree' className={classNames(DIAGRAM_CONTAINER_CLASS, 'pb-[50px]')}>
                  <CrawlTree
                    data={lastDepthNode as any}
                    theme={theme}
                    showPrunableIndicators={showPrunable}
                    showWatermark={showWatermark}
                    watermarkLogoUrl={watermarkLogoUrl}
                    selectedPageIds={selectedPageIds}
                    filterMode={filterMode}
                    hideOrphans={hideOrphans}
                    orphanNodeIds={orphanNodeIds}
                    metricRanges={metricRanges}
                    metricBounds={metricBounds}
                  />
                  <div className={CAPTION_OVERLAY_CLASS}>
                    <div className={getCaptionBLineClass(isDark)}>Scroll to zoom, drag to move.</div>
                  </div>
                </div>
              )}
              {type === 8 && (
                <div data-container='diagram' className={classNames(DIAGRAM_CONTAINER_CLASS, `pt-4 w-full [&_.fg-tooltip]:!z-[15] [&_.graph-tooltip]:!z-[15] [&_[class*='tooltip']]:!z-[15]`)}>
                  <LdaDiagram
                    theme={theme}
                    showWatermark={showWatermark}
                    watermarkLogoUrl={watermarkLogoUrl}
                    viewMode={ldaViewMode}
                    selectedPageIds={selectedPageIds}
                    filterMode={filterMode}
                    metricRanges={metricRanges}
                    metricBounds={metricBounds}
                  />
                </div>
              )}
              <div className={`flex-1 min-h-0 relative ${type !== 3 ? 'hidden' : ''}`} id='three-d-force-graph' />
              <div data-container='diagram' className={classNames(DIAGRAM_CONTAINER_CLASS, `pt-4 w-full [&_.fg-tooltip]:!z-[15] [&_.graph-tooltip]:!z-[15] [&_[class*='tooltip']]:!z-[15]`, type !== 4 && type !== 5 && 'hidden')}>
                <ThreeDCrawlDiagram
                  type={type}
                  theme={theme}
                  showWatermark={showWatermark}
                  watermarkLogoUrl={watermarkLogoUrl}
                  selectedPageIds={selectedPageIds}
                  filterMode={filterMode}
                  showPrunable={showPrunable}
                  hideOrphans={hideOrphans}
                  metricRanges={metricRanges}
                  metricBounds={metricBounds}
                />
                <div className={CAPTION_OVERLAY_CLASS}>
                  <div className={getCaptionALineClass(isDark)}>
                    {type === 4 ? 'Spherical layout · 3D spatial layout' : 'Radial fan · 2D radial layout'}
                  </div>
                  <div className={getCaptionBLineClass(isDark)}>
                    {type === 4 ? 'Drag to orbit · scroll to zoom' : 'Scroll to zoom · drag to move'}
                  </div>
                </div>
              </div>
              {type === 7 && filteredNodesGraph && (
                <div data-container='link-flow' className={classNames(DIAGRAM_CONTAINER_CLASS, 'pt-4 overflow-hidden')}>
                  <ChordDiagram
                    theme={theme}
                    showWatermark={showWatermark}
                    watermarkLogoUrl={watermarkLogoUrl}
                    selectedPageIds={selectedPageIds}
                    filterMode={filterMode}
                    showPrunable={showPrunable}
                    nodes={(filteredNodesGraph as any).nodes || []}
                    links={(filteredNodesGraph as any).links || []}
                    metricRanges={metricRanges}
                    metricBounds={metricBounds}
                  />
                </div>
              )}
              <div className='shrink-0 min-h-4 flex items-center justify-center'>
                {hasStatusBar && renderStatusBar()}
              </div>
            </>
          )}
        </div>

        <PageSelector
          theme={theme}
          isOpen={isPageSelectorOpen}
          onToggle={() => setIsPageSelectorOpen(!isPageSelectorOpen)}
          selectedIds={selectedPageIds}
          onSelectionChange={setSelectedPageIds}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          onMetricFiltersChange={(ranges, bounds) => {
            setMetricRanges(ranges);
            setMetricBounds(bounds);
          }}
        />

        {activeVisualizationInfo && VISUALIZATION_INFO[activeVisualizationInfo] && (
          <VisualizationInfoModal
            isOpen={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            info={VISUALIZATION_INFO[activeVisualizationInfo]}
            theme={theme}
          />
        )}
        {/* Export success toast */}
        {showExportToast && (
          <div className={`animate-[toastSlideIn_0.4s_cubic-bezier(0.22,1,0.36,1)] backdrop-blur-[100px] bg-gradient-to-r from-[rgba(31,172,71,0.3)] to-[rgba(31,172,71,0.15)] rounded-xl bottom-8 shadow-[0_4px_40px_0_rgba(31,172,71,0.2)] flex gap-3 h-[59px] p-[8px_10px] fixed right-20 w-[260px] z-[10000]`}>
            <FontAwesomeIcon icon={faCircleCheck} fontSize={16} className='text-[#1fac47] shrink-0 mt-0.5' />
            <div className='flex gap-[7px]'>
              <div className='flex flex-col justify-between w-[185px]'>
                <span className='text-[#1fac47] text-sm font-medium leading-[1.3] -mt-px'>Download complete!</span>
                <span className={`text-xs font-normal leading-[1.3] ${isDark ? 'text-[#eee]' : 'text-[#555]'}`}>Your PNG has been saved.</span>
              </div>
              <button
                type='button'
                className={`items-center bg-none border-0 cursor-pointer flex shrink-0 text-base justify-center ml-1 p-1 transition-colors duration-200 ease-in-out ${isDark ? 'text-white' : 'text-[#333]'}`}
                onClick={() => setShowExportToast(false)}
                aria-label='Close'
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
