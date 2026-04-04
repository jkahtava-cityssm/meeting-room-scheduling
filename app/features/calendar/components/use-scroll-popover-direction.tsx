import * as React from 'react';

type Side = 'right' | 'left' | 'top' | 'bottom';

type Padding = { top: number; right: number; bottom: number; left: number };

function normalizePadding(padding: number | Partial<Padding> | undefined): Padding {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: padding?.top ?? 0,
    right: padding?.right ?? 0,
    bottom: padding?.bottom ?? 0,
    left: padding?.left ?? 0,
  };
}

export function useScrollPopoverDirection({
  open,
  triggerRef,
  contentRef,
  viewport,
  sideOffset = 10,
  collisionPadding,
  preferOrder = ['right', 'left', 'bottom', 'top'],
}: {
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLElement | null>;
  viewport?: HTMLDivElement | null;
  sideOffset?: number;
  collisionPadding?: number | Partial<Padding>;
  preferOrder?: Side[];
}) {
  const [side, setSide] = React.useState<Side>(preferOrder[0]);
  const padding = React.useMemo(() => normalizePadding(collisionPadding), [collisionPadding]);

  const recompute = React.useCallback(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    const boundary = viewport;
    if (!trigger || !content || !boundary) return;

    const t = trigger.getBoundingClientRect();
    const b = boundary.getBoundingClientRect();

    // Real measured popover size:
    const popW = content.offsetWidth;
    const popH = content.offsetHeight;

    // Shrink boundary by collision padding (matches how you think about “safe area”)
    const leftEdge = b.left + padding.left;
    const rightEdge = b.right - padding.right;
    const topEdge = b.top + padding.top;
    const bottomEdge = b.bottom - padding.bottom;

    const spaceRight = rightEdge - t.right - sideOffset;
    const spaceLeft = t.left - leftEdge - sideOffset;
    const spaceBottom = bottomEdge - t.bottom - sideOffset;
    const spaceTop = t.top - topEdge - sideOffset;

    const fits: Record<Side, boolean> = {
      right: spaceRight >= popW,
      left: spaceLeft >= popW,
      bottom: spaceBottom >= popH,
      top: spaceTop >= popH,
    };

    // Prefer order: right → left → bottom → top (your option 1 + vertical fallback)
    for (const s of preferOrder) {
      if (fits[s]) return s;
    }

    // If none fits, pick the side with the most available space (best worst-case)
    const options: Array<[Side, number]> = [
      ['right', spaceRight],
      ['left', spaceLeft],
      ['bottom', spaceBottom],
      ['top', spaceTop],
    ];
    options.sort((a, c) => c[1] - a[1]);
    return options[0][0];
  }, [triggerRef, contentRef, viewport, sideOffset, padding, preferOrder]);

  React.useLayoutEffect(() => {
    if (!open) return;
    // Wait a frame so the popover content is laid out before measuring.
    const raf = requestAnimationFrame(() => {
      const next = recompute();
      if (next) setSide((prev) => (prev === next ? prev : next));
    });
    return () => cancelAnimationFrame(raf);
  }, [open, recompute]);

  React.useLayoutEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    const boundary = viewport;
    if (!content || !boundary) return;

    // Recompute on content resize (dynamic height/width changes)
    const ro = new ResizeObserver(() => {
      const next = recompute();
      if (next) setSide((prev) => (prev === next ? prev : next));
    });
    ro.observe(content);

    // Recompute on scroll/resize
    const onScrollOrResize = () => {
      const next = recompute();
      if (next) setSide((prev) => (prev === next ? prev : next));
    };

    boundary.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      ro.disconnect();
      boundary.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, viewport, contentRef, recompute]);

  return side;
}
