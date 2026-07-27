import {useEffect, useRef, type RefObject} from 'react';
import {init, getInstanceByDom, ECharts} from 'echarts';

// EChartsOption typings vary between echarts 4.x/5.x major versions; accept
// the looser shape and let setOption coerce.
type TEChartsOption = Parameters<ECharts['setOption']>[0];

interface IUseEChartsOptions {
  enabled?: boolean;
  option: TEChartsOption | null;
  notMerge?: boolean;
}

export const useECharts = (
  containerRef: RefObject<HTMLElement>,
  {enabled = true, option, notMerge = true}: IUseEChartsOptions,
): void => {
  const instanceRef = useRef<ECharts | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!enabled || !el || !option) {
      return;
    }
    const existing = getInstanceByDom(el as HTMLElement);
    const chart = existing ?? init(el as HTMLElement);
    instanceRef.current = chart;
    chart.setOption(option, notMerge);

    const handleResize = (): void => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      const live = getInstanceByDom(el as HTMLElement);
      live?.dispose();
      instanceRef.current = null;
    };
  }, [containerRef, enabled, option, notMerge]);
};

export const disposeEChartsInDom = (root: HTMLElement | null): void => {
  if (!root) return;
  const candidates = root.querySelectorAll<HTMLElement>('div');
  candidates.forEach(el => {
    const instance = getInstanceByDom(el);
    instance?.dispose();
  });
};
