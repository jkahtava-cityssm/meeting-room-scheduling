import React from "react";

export function useOverflowDetection(itemsCount: number) {
	const GAP_SIZE = 8;
	const MINIMUM_BADGE_WIDTH = 62;

	const containerRef = React.useRef<HTMLDivElement>(null);
	const shadowRef = React.useRef<HTMLDivElement>(null);
	const actionsRef = React.useRef<HTMLDivElement>(null);

	const [visibleCount, setVisibleCount] = React.useState(itemsCount);
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
		const maxCountBadge = shadowChildren.find(el => el.hasAttribute("data-shadow-plus"));
		const BadgeList = shadowChildren.filter(el => !el.hasAttribute("data-shadow-plus"));

		const maxCountBadgeWidth = maxCountBadge ? maxCountBadge.getBoundingClientRect().width + 4 : MINIMUM_BADGE_WIDTH;
		//723
		let currentWidth = 0;
		let fitCount = 0;

		for (let i = 0; i < BadgeList.length; i++) {
			const childWidth = BadgeList[i].getBoundingClientRect().width + 4;
			const spaceNeeded = childWidth + GAP_SIZE;
			if (currentWidth + spaceNeeded + maxCountBadgeWidth > availableWidth) break;
			currentWidth += childWidth;
			fitCount++;
		}

		const totalBadgesWidth = BadgeList.reduce((acc, el) => acc + el.getBoundingClientRect().width, 0);
		const totalGapsWidth = Math.max(0, BadgeList.length - 1) * GAP_SIZE;
		const totalNeeded = totalBadgesWidth + totalGapsWidth;

		if (totalNeeded < availableWidth && itemsCount <= BadgeList.length) {
			setVisibleCount(itemsCount);
		} else {
			setVisibleCount(Math.max(0, fitCount));
		}
	}, [itemsCount]);

	React.useLayoutEffect(() => {
		calculateBadgeBounds();
	}, [itemsCount, calculateBadgeBounds]);

	React.useLayoutEffect(() => {
		if (!containerRef.current || !actionsRef.current) return;

		const observer = new ResizeObserver(() => {
			window.requestAnimationFrame(calculateBadgeBounds);
		});

		observer.observe(containerRef.current);
		observer.observe(actionsRef.current);

		return () => observer.disconnect();
	}, [calculateBadgeBounds]);

	return { containerRef, shadowRef, actionsRef, visibleCount, measurementLimit };
}
