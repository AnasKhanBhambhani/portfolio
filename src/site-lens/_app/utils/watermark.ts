import type {Selection} from 'd3-selection';

export const WATERMARK_CONFIG = {
  opacity: 0.153,
  sizeRatio: 0.084,
  logoPathDark: '/site-lens-watermark.svg',
  logoPathLight: '/site-lens-watermark.svg',
  aspectRatio: 713 / 55,
  getLogoPath: function(theme: 'light' | 'dark', logoUrl?: string | null): string {
    if (logoUrl) return logoUrl;
    return theme === 'light' ? WATERMARK_CONFIG.logoPathLight : WATERMARK_CONFIG.logoPathDark;
  },
};

export const addSvgWatermark = (
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number,
  theme: 'light' | 'dark' = 'dark',
  logoUrl?: string | null,
): Selection<SVGImageElement, unknown, null, undefined> | null => {
  if (width < 100 || height < 100) return null;

  const {opacity, sizeRatio, aspectRatio, getLogoPath} = WATERMARK_CONFIG;
  const logoPath = getLogoPath(theme, logoUrl);

  const watermarkHeight = Math.min(width, height) * sizeRatio;
  const watermarkWidth = watermarkHeight * aspectRatio;

  const watermark = svg.append('image')
    .attr('class', 'searchatlas-watermark')
    .attr('href', logoPath)
    .attr('x', (width - watermarkWidth) / 2)
    .attr('y', (height - watermarkHeight) / 2)
    .attr('width', watermarkWidth)
    .attr('height', watermarkHeight)
    .attr('opacity', opacity)
    .attr('pointer-events', 'none');

  watermark.lower();
  return watermark;
};
