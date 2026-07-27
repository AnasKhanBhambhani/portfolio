import {Graph} from './components/graph';
import React, {useReducer, useMemo} from 'react';
import MyContext, {initialState, reducer} from './components/context';
import type {IThreeDCrawlDiagramProps} from '../../../types';

export default function ThreeDCrawlDiagram(props: IThreeDCrawlDiagramProps) {
  const [deviceInfo, dispatch] = useReducer(reducer, initialState);

  const contextValue = useMemo(
    () => ({
      deviceInfo,
      dispatch,
    }),
    [deviceInfo, dispatch],
  );
  return (
    <MyContext.Provider value={contextValue}>
      <Graph
        type={props.type}
        theme={props.theme}
        showWatermark={props.showWatermark}
        watermarkLogoUrl={props.watermarkLogoUrl}
        selectedPageIds={props.selectedPageIds}
        filterMode={props.filterMode}
        showPrunable={props.showPrunable}
        hideOrphans={props.hideOrphans}
        metricRanges={props.metricRanges}
        metricBounds={props.metricBounds}
      />
    </MyContext.Provider>
  );
}
