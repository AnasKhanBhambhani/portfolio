import {parseISO, isValid, subYears, formatDistanceToNow} from 'date-fns';
import type {IDepthNode} from '@/modules/site-audit/v1/api.types';

export const lightenColor = (color, amount) => {
  const hex = color.slice(1);
  const num = parseInt(hex, 16);
  let r = (num >> 16) + amount;
  let g = (num >> 8 & 255) + amount;
  let b = (num & 255) + amount;
  r = Math.min(Math.max(0, r), 255);
  g = Math.min(Math.max(0, g), 255);
  b = Math.min(Math.max(0, b), 255);
  const newHex = ((r << 16) | (g << 8) | b).toString(16);
  return '#' + newHex.padStart(6, '0');
};

/**
 * Normalizes a raw metric value to a 0-1 scale, applying optional logarithmic
 * scaling and inversion. This is the shared normalization step used both for
 * gradient color mapping and for deriving band/ring values in the detail drawer.
 * @param {number} value - The raw value to normalize
 * @param {number} min - Minimum value in the range
 * @param {number} max - Maximum value in the range
 * @param {object} options - Configuration options
 * @param {boolean} options.useLogScale - Use logarithmic scaling (default: false)
 * @param {boolean} options.invert - Reverse the scale (default: false)
 * @return {number} Adjusted normalized value between 0 and 1
 */
const normalizeMetric = (
  value: number,
  min: number,
  max: number,
  options: {useLogScale?: boolean; invert?: boolean} = {},
): number => {
  const {useLogScale = false, invert = false} = options;

  let normalized: number;
  if (useLogScale) {
    const logValue = Math.log10(Math.max(1, value));
    const logMin = Math.log10(Math.max(1, min));
    const logMax = Math.log10(Math.max(1, max));
    normalized = (logValue - logMin) / (logMax - logMin || 1);
  } else {
    normalized = (value - min) / (max - min || 1);
  }

  normalized = Math.max(0, Math.min(1, normalized));
  return invert ? 1 - normalized : normalized;
};

/**
 * Recomputes the adjusted 0-1 normalized value for a gradient metric using the
 * SAME min/max/scale parameters as getColorByValue, so ring percent and Low/
 * Medium/High banding always line up with the node's actual dot color.
 * @param {Partial<IDepthNode>} node - The node data object
 * @param {string} colorBy - The gradient color-by metric key
 * @return {number} Adjusted normalized value between 0 and 1
 */
const getMetricNormalized = (node: Partial<IDepthNode>, colorBy: string): number => {
  switch (colorBy) {
    case 'traffic':
      return normalizeMetric(node?.traffic ?? 1, 0, 1000000, {useLogScale: true});
    case 'impressions':
      return normalizeMetric(node?.impressions ?? 1, 0, 10000000, {useLogScale: true});
    case 'keywords':
      return normalizeMetric(node?.keywords ?? 1, 0, 100000, {useLogScale: true});
    case 'bounceRate':
      return normalizeMetric(node?.bounceRate ?? 50, 0, 100, {invert: true});
    case 'dwellTime':
      return normalizeMetric(node?.dwellTime ?? 0, 0, 300);
    case 'conversions':
      return normalizeMetric(node?.conversions ?? 1, 0, 10000, {useLogScale: true});
    case 'conversionValue':
      return normalizeMetric(node?.conversionValue ?? 1, 0, 1000000, {useLogScale: true});
    case 'lastUpdated': {
      const raw = node?.lastUpdated;
      const lastUpdatedDate = raw ? parseISO(String(raw)) : null;
      const now = new Date();
      const twoYearsAgo = subYears(now, 2);
      if (!lastUpdatedDate || !isValid(lastUpdatedDate) || lastUpdatedDate < twoYearsAgo) {
        return 0;
      }
      return Math.max(0, Math.min(1, (lastUpdatedDate.getTime() - twoYearsAgo.getTime()) / (now.getTime() - twoYearsAgo.getTime())));
    }
    default:
      return 0;
  }
};

/**
 * Maps a 0-1000 Page Health score to a solid band color. This is the single
 * source of truth for page-health banding, shared by getColorByValue (node dot)
 * and getNodeColorBySummary (detail drawer) so the two can never drift apart.
 * @param {number} health - Page health score on a 0-1000 scale
 * @return {string} Hex band color (#RRGGBB)
 */
const getPageHealthColor = (health: number): string =>
  health >= 700 ? '#27AE60' : health >= 300 ? '#F1AA3E' : '#E74C3C';

/**
 * Maps a 0-1 normalized gradient value to a solid red/amber/green band color.
 * Single source of truth for the gradient-metric thresholds, shared by
 * getColorByValue (node dot) and getNodeColorBySummary (detail drawer).
 * @param {number} adjusted - Normalized value between 0 and 1
 * @return {string} Hex band color (#RRGGBB)
 */
const getBandColor = (adjusted: number): string =>
  adjusted < 0.33 ? '#E74C3C' : adjusted < 0.66 ? '#F1AA3E' : '#27AE60';

// Shared "no data" treatment: a neutral gray distinct from every red/amber/green band,
// so a page that was never measured for a metric doesn't silently render as if it scored
// a real mid-range value for that metric.
export const NO_DATA_COLOR = '#9E9DA1';

const hasRawMetricValue = (node: Partial<IDepthNode>, key: string): boolean => {
  const value = (node as unknown as Record<string, unknown>)?.[key];
  if (value === null || value === undefined) return false;
  // lastUpdated is parsed as a date (parseISO) despite the declared number|null type — a
  // string value here is real data, not "no data", so it's exempt from the numeric check.
  if (key === 'lastUpdated') return true;
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Calculates node color based on the selected 'Color by' metric.
 * Every metric resolves to one of three solid bands (red / amber / green) so the
 * canvas dots read as discrete health bands rather than a continuous gradient:
 * - Red = Low/Bad values
 * - Amber = Medium/Average values
 * - Green = High/Good values
 *
 * @param {any} node - The node data object
 * @param {string} colorBy - The selected color-by metric key
 * @return {string | null} Hex color string or null if using default colors
 */
export const getColorByValue = (node: any, colorBy: string) => {
  if (!colorBy || colorBy === 'default') {
    return null;
  }

  switch (colorBy) {
    case 'pageHealth':
      // Page Health Score: 0-1000 scale, solid-banded (Critical / Needs attention / Healthy).
      // A missing score is "no data", not "500/1000" — those must not look the same.
      return hasRawMetricValue(node, 'pageHealth') ? getPageHealthColor(node.pageHealth) : NO_DATA_COLOR;

    case 'indexable':
      // Status: green = Active, red = Archived, gray = unknown.
      if (node.status === null || node.status === undefined) return NO_DATA_COLOR;
      return node.status === 'Active' ? '#27AE60' : '#E74C3C';

    case 'traffic':
    case 'impressions':
    case 'keywords':
    case 'bounceRate':
    case 'dwellTime':
    case 'conversions':
    case 'conversionValue':
    case 'lastUpdated':
      // Gradient metrics: normalize with the shared per-metric params, then band
      // into a solid red/amber/green color so all nodes read as discrete bands.
      // A missing raw value is "no data", not a fabricated mid-range default.
      if (!hasRawMetricValue(node, colorBy)) return NO_DATA_COLOR;
      return getBandColor(getMetricNormalized(node, colorBy));

    default:
      return null;
  }
};

// Same k-suffix convention as METRICS in constants.ts (e.g. 1200 -> "1.2k").
const formatK = (v: number): string => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));

interface IColorByMetricMeta {
  title: string;
  format?: (raw: number | string) => string;
}

export const COLOR_BY_METRIC_META: Record<string, IColorByMetricMeta> = {
  pageHealth: {title: 'Proficiency'},
  indexable: {title: 'Status'},
  traffic: {title: 'Usage', format: raw => formatK(Number(raw))},
  impressions: {title: 'Reach', format: raw => formatK(Number(raw))},
  keywords: {title: 'Related items', format: raw => formatK(Number(raw))},
  bounceRate: {title: 'Bounce Rate (GA4)', format: raw => `${Math.round(Number(raw))}%`},
  dwellTime: {
    title: 'Dwell Time (GA4)',
    format: raw => {
      const seconds = Number(raw);
      const minutes = Math.floor(seconds / 60);
      const remaining = Math.round(seconds % 60);
      return minutes >= 1 ? `${minutes}m ${remaining}s` : `${remaining}s`;
    },
  },
  conversions: {title: 'Conversions (GA4)', format: raw => formatK(Number(raw))},
  conversionValue: {title: 'Conversion Value (GA4)', format: raw => `$${formatK(Number(raw))}`},
  lastUpdated: {
    title: 'Recently Updated',
    format: raw => {
      const date = parseISO(String(raw));
      return isValid(date) ? formatDistanceToNow(date, {addSuffix: true}) : 'Unknown';
    },
  },
};

export interface INodeColorBySummary {
  title: string;
  color: string;
  bandLabel: string;
  displayValue: string | null;
  ringPercent: number | null;
}

/**
 * Builds the color-by summary for the node-detail drawer, driven by whichever
 * "Color by" metric is active. The color always comes from the same helpers as
 * getColorByValue so the drawer's ring/pill matches the node's dot color.
 * @param {Partial<IDepthNode>} node - The selected node data object
 * @param {string} colorBy - The active color-by metric key
 * @return {INodeColorBySummary} Title, color, band label, display value and ring percent
 */
export const getNodeColorBySummary = (node: Partial<IDepthNode>, colorBy: string): INodeColorBySummary => {
  const metric = !colorBy || colorBy === 'default' ? 'pageHealth' : colorBy;

  if (metric === 'pageHealth') {
    if (!hasRawMetricValue(node, 'pageHealth')) {
      return {title: 'Proficiency', color: NO_DATA_COLOR, bandLabel: 'No data', displayValue: null, ringPercent: null};
    }
    // pageHealth is stored on a 0-1000 scale; band it the same way as getColorByValue.
    const health = node.pageHealth as number;
    const color = getPageHealthColor(health);
    const bandLabel = health >= 700 ? 'Strong' : health >= 300 ? 'Growing' : 'Learning';
    return {title: 'Proficiency', color, bandLabel, displayValue: null, ringPercent: Math.round(health / 10)};
  }

  if (metric === 'indexable') {
    if (node?.status === null || node?.status === undefined) {
      return {title: 'Status', color: NO_DATA_COLOR, bandLabel: 'No data', displayValue: null, ringPercent: null};
    }
    return {
      title: 'Status',
      color: node?.status === 'Active' ? '#27AE60' : '#E74C3C',
      bandLabel: node?.status ?? 'Unknown',
      displayValue: null,
      ringPercent: null,
    };
  }

  const meta = COLOR_BY_METRIC_META[metric];
  if (node?.[metric] == null) {
    return {title: meta?.title ?? metric, color: NO_DATA_COLOR, bandLabel: 'No data', displayValue: null, ringPercent: null};
  }

  const adjusted = getMetricNormalized(node, metric);
  const bandLabel = adjusted < 0.33 ? 'Low' : adjusted < 0.66 ? 'Medium' : 'High';
  return {
    title: meta.title,
    color: getBandColor(adjusted),
    bandLabel,
    displayValue: meta.format ? meta.format(node[metric] as number | string) : null,
    ringPercent: Math.round(adjusted * 100),
  };
};
