import {getInstanceByDom} from 'echarts';
import type {TTheme} from './types';
import {MixPanel} from '@/utils/mixpanel';
import {SA_SITE_LENS_EXPORTED} from '@/constants/events';

export const useHandleExportPNG = (type: number, theme: TTheme) => {
  const handleExportPNG = (): void => {
    MixPanel.track(SA_SITE_LENS_EXPORTED, {type});
    try {
      let container: HTMLElement | null = null;
      let filename = 'site-visualization';
      let isCanvas = false;
      switch (type) {
        case 1:
          container = document.querySelector('[data-container="tree-diagram"]') as HTMLElement;
          filename = 'tree-diagram';
          break;
        case 6:
          container = document.querySelector('[data-container="crawl-tree"]') as HTMLElement;
          filename = 'crawl-tree';
          break;
        case 7:
          container = document.querySelector('[data-container="link-flow"]') as HTMLElement;
          filename = 'link-flow-diagram';
          break;
        case 8:
          // LDA Topics uses diagramContainer, not crawlTreeContainer
          container = document.querySelector('[data-container="diagram"]') as HTMLElement;
          filename = 'lda-topics';
          break;
        case 4:
        case 5:
          // For 3D, try to find the canvas wrapper first for better dimension detection
          if (type === 4) {
            const canvasWrapper = document.getElementById('3d-graph') || document.querySelector('[data-container="diagram"]') as HTMLElement;
            container = canvasWrapper || document.querySelector('[data-container="diagram"]') as HTMLElement;
          } else {
            container = document.querySelector('[data-container="diagram"]') as HTMLElement;
          }
          filename = type === 4 ? '3d-crawl-diagram' : 'node-cluster-diagram';
          isCanvas = true;
          break;
        default:
          break;
      }

      if (!container) {
        return;
      }

      const backgroundColor = theme === 'dark' ? '#121317' : '#f5f5f5';

      // For ECharts (Type 1 - TreeDiagram), use ECharts' built-in getDataURL for full chart export
      if (type === 1) {
        // ReactECharts registers the instance on the container div (which wraps the canvas)
        // Try to find the echarts container by looking for elements with echarts instance
        const echartsContainers = container.querySelectorAll('div');
        for (const elem of Array.from(echartsContainers)) {
          const chartInstance = getInstanceByDom(elem as HTMLElement);
          if (chartInstance) {
            try {
              // Reset zoom/pan to show the full tree before capturing
              chartInstance.dispatchAction({
                type: 'restore',
              });

              // Wait for the chart to re-render after restore, then capture
              setTimeout(() => {
                try {
                  const dataURL = chartInstance.getDataURL({
                    type: 'png',
                    pixelRatio: 2,
                    backgroundColor: backgroundColor,
                  });
                  const link = document.createElement('a');
                  link.download = `${filename}.png`;
                  link.href = dataURL;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } catch (error) {
                  console.warn('ECharts getDataURL failed:', error);
                }
              }, 300); // Wait for restore animation to complete
              return;
            } catch (error) {
              console.warn('ECharts export failed, falling back to canvas capture:', error);
            }
            break;
          }
        }
      }

      const sourceCanvas = container.querySelector('canvas') as HTMLCanvasElement;
      if (sourceCanvas && (isCanvas || type === 1)) {
        // Check if this is a WebGL canvas (3D) or 2D canvas
        const isWebGLCanvas = type === 4;
        const is2DForceGraph = type === 5;

        // Function to perform the actual canvas capture
        const performCanvasCapture = () => {
          const gl = sourceCanvas.getContext('webgl') || sourceCanvas.getContext('webgl2') || sourceCanvas.getContext('experimental-webgl');

          // For WebGL (3D) canvas, dimensions need special handling
          // WebGL canvas might not have width/height attributes set, use client dimensions
          // For 2D canvas, prefer actual width/height attributes, fallback to client dimensions
          let canvasWidth: number;
          let canvasHeight: number;

          if (isWebGLCanvas && gl) {
            // WebGL canvas - use display dimensions (clientWidth/clientHeight)
            // WebGL canvas internal resolution (width/height) might differ from display size
            // We need to capture at display size for proper image export
            const displayWidth = sourceCanvas.clientWidth;
            const displayHeight = sourceCanvas.clientHeight;
            const internalWidth = sourceCanvas.width;
            const internalHeight = sourceCanvas.height;

            // Use display dimensions for export, but ensure they're valid
            if (displayWidth > 0 && displayHeight > 0) {
              canvasWidth = displayWidth;
              canvasHeight = displayHeight;
            } else if (internalWidth > 0 && internalHeight > 0) {
              // Fallback to internal dimensions if display dimensions are invalid
              canvasWidth = internalWidth;
              canvasHeight = internalHeight;
            } else {
              // Final fallback to container dimensions
              canvasWidth = container.clientWidth;
              canvasHeight = container.clientHeight;
            }
          } else {
            // 2D canvas - prefer actual width/height attributes
            canvasWidth = sourceCanvas.width || sourceCanvas.clientWidth || container.clientWidth;
            canvasHeight = sourceCanvas.height || sourceCanvas.clientHeight || container.clientHeight;
          }

          if (canvasWidth <= 0 || canvasHeight <= 0) {
            console.warn('Canvas dimensions are invalid:', {canvasWidth, canvasHeight});
            return;
          }

          const exportCanvas = document.createElement('canvas');
          const ctx = exportCanvas.getContext('2d', {alpha: false});
          if (!ctx) {
            console.error('Failed to get 2D context for export canvas');
            return;
          }

          // Set export canvas dimensions to match source canvas
          exportCanvas.width = canvasWidth;
          exportCanvas.height = canvasHeight;

          // Fill background first
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          // For WebGL canvas, we need to ensure it's rendered before capture
          // Use requestAnimationFrame to ensure the current frame is captured
          const captureCanvas = () => {
            try {
              // Draw source canvas onto export canvas
              // For WebGL, the canvas should already be rendered, so we can capture it directly
              ctx.drawImage(sourceCanvas, 0, 0, canvasWidth, canvasHeight);

              // Convert to blob and trigger download
              exportCanvas.toBlob(
                blob => {
                  if (blob) {
                    const link = document.createElement('a');
                    link.download = `${filename}.png`;
                    link.href = URL.createObjectURL(blob);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    // Clean up blob URL after a short delay to ensure download starts
                    setTimeout(() => {
                      URL.revokeObjectURL(link.href);
                    }, 100);
                  } else {
                    console.error('Failed to create blob from canvas');
                  }
                },
                'image/png',
                1.0,
              );
            } catch (error) {
              console.error('Error capturing canvas:', error);
            }
          };

          // For WebGL, wait for next frame to ensure rendering is complete
          if (isWebGLCanvas) {
            requestAnimationFrame(() => {
              // Double RAF to ensure WebGL frame is fully rendered
              requestAnimationFrame(captureCanvas);
            });
          } else {
            // For 2D canvas, capture immediately
            captureCanvas();
          }
        };

        // For 2D/3D force graphs (types 4 and 5), dispatch event to zoom to fit all nodes first
        if (is2DForceGraph || isWebGLCanvas) {
          const exportEvent = new CustomEvent('graph-export-prepare', {
            detail: {
              graphType: type,
              callback: performCanvasCapture,
            },
          });
          window.dispatchEvent(exportEvent);
        } else {
          // For other canvas types, capture immediately
          performCanvasCapture();
        }
        return;
      }

      let svg = container.querySelector('svg') as SVGElement;
      if (!svg) {
        const allSvgs = container.querySelectorAll('svg');
        if (allSvgs.length > 0) {
          let largestSvg = allSvgs[0] as SVGElement;
          let largestArea = 0;
          allSvgs.forEach(s => {
            const rect = s.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area > largestArea) {
              largestArea = area;
              largestSvg = s as SVGElement;
            }
          });
          svg = largestSvg;
        }
      }
      if (svg) {
        try {
          // Clone the SVG to avoid modifying the original
          const clonedSvg = svg.cloneNode(true) as SVGElement;
          clonedSvg.querySelectorAll('foreignObject').forEach(el => el.remove());

          let width: number;
          let height: number;
          let viewBoxX = 0;
          let viewBoxY = 0;

          // For CrawlTree (type 6), get the actual tree content dimensions
          if (type === 6) {
            const treeContainer = svg.querySelector('.tree-container') as SVGGElement;
            if (treeContainer) {
              // Get the bounding box of the actual tree content
              const treeBBox = treeContainer.getBBox();
              const padding = 60; // Add padding around the tree

              viewBoxX = treeBBox.x - padding;
              viewBoxY = treeBBox.y - padding;
              width = Math.round(treeBBox.width + padding * 2);
              height = Math.round(treeBBox.height + padding * 2);

              // Remove the zoom transform from the cloned tree container
              const clonedTreeContainer = clonedSvg.querySelector('.tree-container') as SVGGElement;
              if (clonedTreeContainer) {
                clonedTreeContainer.removeAttribute('transform');
              }
            } else {
              // Fallback to viewport dimensions
              const bbox = svg.getBoundingClientRect();
              width = Math.round(bbox.width) || container.clientWidth || 1200;
              height = Math.round(bbox.height) || container.clientHeight || 800;
            }
          } else {
            // Default behavior for other types - use viewport dimensions
            const bbox = svg.getBoundingClientRect();
            width = Math.round(bbox.width) || container.clientWidth || 1200;
            height = Math.round(bbox.height) || container.clientHeight || 800;
          }

          // Set SVG attributes for export
          clonedSvg.setAttribute('width', width.toString());
          clonedSvg.setAttribute('height', height.toString());

          // Set viewBox to show the full content
          clonedSvg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${width} ${height}`);

          const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          backgroundRect.setAttribute('x', viewBoxX.toString());
          backgroundRect.setAttribute('y', viewBoxY.toString());
          backgroundRect.setAttribute('width', width.toString());
          backgroundRect.setAttribute('height', height.toString());
          backgroundRect.setAttribute('fill', backgroundColor);
          clonedSvg.insertBefore(backgroundRect, clonedSvg.firstChild);

          // Serialize SVG to string
          const svgData = new XMLSerializer().serializeToString(clonedSvg);
          const svgWithXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svgData}`;
          const svgBlob = new Blob([svgWithXml], {type: 'image/svg+xml;charset=utf-8'});
          const url = URL.createObjectURL(svgBlob);

          // Create canvas for PNG conversion
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', {alpha: false});
          if (!ctx) {
            URL.revokeObjectURL(url);
            return;
          }

          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;
          ctx.scale(scale, scale);

          // Create image from SVG
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            try {
              // Fill background
              ctx.fillStyle = backgroundColor;
              ctx.fillRect(0, 0, width, height);

              // Draw SVG image
              ctx.drawImage(img, 0, 0, width, height);

              // Convert to blob and download
              canvas.toBlob(
                blob => {
                  if (blob) {
                    const link = document.createElement('a');
                    link.download = `${filename}.png`;
                    link.href = URL.createObjectURL(blob);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    // Clean up blob URLs
                    setTimeout(() => {
                      URL.revokeObjectURL(link.href);
                      URL.revokeObjectURL(url);
                    }, 100);
                  } else {
                    console.error('Failed to create blob from SVG canvas');
                    URL.revokeObjectURL(url);
                  }
                },
                'image/png',
                1.0,
              );
            } catch (error) {
              console.error('Error drawing SVG to canvas:', error);
              URL.revokeObjectURL(url);
            }
          };

          img.onerror = () => {
            console.warn('Failed to load SVG as image, falling back to SVG download');

            // Fallback: download as SVG
            const link = document.createElement('a');
            link.download = `${filename}.svg`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => {
              URL.revokeObjectURL(url);
            }, 100);
          };

          img.src = url;
          return;
        } catch (error) {
          console.error('Error exporting SVG:', error);
        }
      }
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  return handleExportPNG;
};
