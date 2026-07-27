// Ported from the app's getProgressColor: health-band color from a value
// against min/average/max thresholds.
export const getProgressColor = (value: number, min: number, average: number, max?: number): string => {
  if (value <= min) return '#F44343';
  if (value <= average && value > min) return '#FF8536';
  if (value > average) {
    if (max && value < max) return '#BFE15E';
    return '#52D477';
  }
  return '#52D477';
};
