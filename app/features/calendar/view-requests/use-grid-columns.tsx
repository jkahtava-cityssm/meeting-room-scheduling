import { useEffect, useState, useRef, RefObject } from 'react';

export function useGridColumns(externalRef?: RefObject<HTMLElement | null>, delay = 150) {
  const [columns, setColumns] = useState(1);
  // Use the provided ref or create a fallback one
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef || internalRef;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const calculateColumns = (width: number) => {
      const availableWidth = width - 32;
      const count = Math.floor((availableWidth + 16) / (400 + 16));

      return Math.max(1, count);
    };

    const observer = new ResizeObserver((entries) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      const entry = entries[0];
      if (entry) {
        const { width } = entry.contentRect;

        timeoutRef.current = setTimeout(() => {
          const newColumnCount = calculateColumns(width);

          // Only trigger a re-render if the column count actually changed
          setColumns((prev) => (prev !== newColumnCount ? Math.max(1, newColumnCount || 1) : prev));
        }, delay);
      }
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [containerRef, delay]);

  return { columns, containerRef };
}
