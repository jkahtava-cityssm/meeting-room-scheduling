import { useEffect, useState } from 'react';

export function useGridColumns() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) return 1; // Mobile
      if (width < 1280) return 2; // Tablet / Small Laptop
      return 3; // Desktop
    };

    const handler = () => setColumns(calculateColumns());

    // Set initial value
    handler();

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return columns;
}
