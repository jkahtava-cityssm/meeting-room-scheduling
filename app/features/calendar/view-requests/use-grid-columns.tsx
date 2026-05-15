import { useState, useCallback, useRef } from 'react';

export function useGridColumns(delay = 150) {
  const [columns, setColumns] = useState(1);
  const observerRef = useRef<ResizeObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  const calculateColumns = (width: number) => {
    const availableWidth = width - 32;
    const count = Math.floor((availableWidth + 16) / (400 + 16));
    return Math.max(1, count);
  };

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      //Sync the Ref Object for the Virtualizer and handleStatusChange
      parentRef.current = node;

      //Cleanup old observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (node) {
        const observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
            const { width } = entry.contentRect;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
              const newCount = calculateColumns(width);
              setColumns((prev) => (prev !== newCount ? newCount : prev));
            }, delay);
          }
        });

        observer.observe(node);
        observerRef.current = observer;

        const initialCount = calculateColumns(node.offsetWidth);
        setColumns(initialCount);
      }
    },
    [delay],
  );

  return { columns, setContainerRef, parentRef };
}
