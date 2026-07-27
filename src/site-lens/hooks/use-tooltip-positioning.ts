import {useEffect} from 'react';

export const useTooltipPositioning = (options?: {
  bottomThreshold?: number;
  margin?: number;
  zIndex?: number;
  checkInterval?: number;
}) => {
  const {
    bottomThreshold = 50,
    margin = 15,
    zIndex = 10000,
    checkInterval = 100,
  } = options || {};

  useEffect(() => {
    const adjustTooltipPosition = () => {
      const tooltips = Array.from(document.querySelectorAll('div')).filter((div: Element) => {
        const htmlElement = div as HTMLElement;
        const style = window.getComputedStyle(htmlElement);

        const isPositionedTooltip = style.position === 'absolute' && style.pointerEvents === 'none';
        if (!isPositionedTooltip) return false;
        const textContent = htmlElement.textContent || '';
        const hasTooltipContent =
          textContent.includes('URL:') || textContent.includes('Page Title:') ||
          textContent.includes('Depth:') || textContent.includes('Health:') ||
          htmlElement.classList.contains('chord-tooltip');
        return hasTooltipContent;
      });

      tooltips.forEach((tooltip: Element) => {
        const htmlElement = tooltip as HTMLElement;
        const rect = htmlElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (parseFloat(htmlElement.style.zIndex || '0') < zIndex) {
          htmlElement.style.zIndex = String(zIndex);
        }

        const currentLeft = parseFloat(htmlElement.style.left) || rect.left;
        const currentTop = parseFloat(htmlElement.style.top) || rect.top;

        let newLeft = currentLeft;
        let newTop = currentTop;
        if (rect.bottom > viewportHeight - bottomThreshold) {
          const tooltipHeight = rect.height || htmlElement.offsetHeight;
          const offset = 25;

          newTop = currentTop - tooltipHeight - offset;

          if (newTop < margin) {
            newTop = margin;
          }
        }

        if (rect.right > viewportWidth - margin) {
          newLeft = viewportWidth - rect.width - margin;
        }

        if (rect.left < margin) {
          newLeft = margin;
        }

        if (newTop < margin) {
          newTop = margin;
        }

        if (Math.abs(newLeft - currentLeft) > 1 || Math.abs(newTop - currentTop) > 1) {
          htmlElement.style.left = `${newLeft}px`;
          htmlElement.style.top = `${newTop}px`;
        }
      });
    };

    const observer = new MutationObserver(() => {
      requestAnimationFrame(adjustTooltipPosition);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    });

    let rafId: number | null = null;
    const throttledAdjust = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          adjustTooltipPosition();
          rafId = null;
        });
      }
    };

    window.addEventListener('mousemove', throttledAdjust);

    const intervalId = setInterval(() => {
      requestAnimationFrame(adjustTooltipPosition);
    }, checkInterval);

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', throttledAdjust);
      clearInterval(intervalId);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [bottomThreshold, margin, zIndex, checkInterval]);
};
