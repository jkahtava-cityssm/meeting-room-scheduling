import React from 'react';

export function useOverflowDetection(selectedValues: string[]) {
  const GAP_SIZE = 8;
  const MINIMUM_BADGE_WIDTH = 62;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const shadowRef = React.useRef<HTMLDivElement>(null);
  const actionsRef = React.useRef<HTMLDivElement>(null);

  const [visibleIndices, setVisibleIndices] = React.useState<number[]>([]);
  const [measurementLimit, setMeasurementLimit] = React.useState(10);

  const calculateBadgeBounds = React.useCallback(() => {
    const container = containerRef.current;
    const shadow = shadowRef.current;
    const actions = actionsRef.current;
    if (!container || !shadow || !actions) return;

    const { width: actionAreaWidth } = actions.getBoundingClientRect();

    const { width: containerWidth } = container.getBoundingClientRect();
    const availableWidth = containerWidth - actionAreaWidth - 16;

    const estimatedMax = Math.ceil(availableWidth / MINIMUM_BADGE_WIDTH) + 2;
    setMeasurementLimit(estimatedMax);

    const shadowChildren = Array.from(shadow.children) as HTMLElement[];
    const maxCountBadge = shadowChildren.find((el) => el.hasAttribute('data-shadow-plus'));
    const BadgeList = shadowChildren.filter((el) => !el.hasAttribute('data-shadow-plus'));

    const maxCountBadgeWidth = maxCountBadge ? maxCountBadge.getBoundingClientRect().width + 4 : MINIMUM_BADGE_WIDTH;
    //723
    let currentWidth = 0;
    const fittingIndices: number[] = [];

    for (let i = 0; i < BadgeList.length; i++) {
      const childWidth = BadgeList[i].getBoundingClientRect().width + 4;
      const spaceNeeded = childWidth + (fittingIndices.length > 0 ? GAP_SIZE : 0);

      if (currentWidth + spaceNeeded + maxCountBadgeWidth <= availableWidth) {
        currentWidth += spaceNeeded;
        fittingIndices.push(i);
      } else {
        // 2. FALLBACK: If the sequence breaks, check if ANY single item
        // later in the list fits alongside the maxBadge.
        if (fittingIndices.length === 0) {
          for (let j = i; j < BadgeList.length; j++) {
            const fallbackWidth = BadgeList[j].getBoundingClientRect().width + 4;
            if (fallbackWidth + maxCountBadgeWidth <= availableWidth) {
              fittingIndices.push(j);
              break;
            }
          }
        }
        break;
      }
    }

    const totalBadgesWidth = BadgeList.reduce((acc, el) => acc + el.getBoundingClientRect().width + 4, 0);
    const totalGapsWidth = Math.max(0, BadgeList.length - 1) * GAP_SIZE;
    const totalNeeded = totalBadgesWidth + totalGapsWidth;

    if (totalNeeded <= availableWidth) {
      setVisibleIndices(selectedValues.map((_, i) => i));
    } else {
      setVisibleIndices(fittingIndices);
    }
  }, [selectedValues]);

  React.useLayoutEffect(() => {
    calculateBadgeBounds();
  }, [selectedValues, calculateBadgeBounds]);

  React.useLayoutEffect(() => {
    if (!containerRef.current || !actionsRef.current) return;

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(calculateBadgeBounds);
    });

    observer.observe(containerRef.current);
    observer.observe(actionsRef.current);

    return () => observer.disconnect();
  }, [calculateBadgeBounds]);

  return { containerRef, shadowRef, actionsRef, visibleIndices, measurementLimit };
}
