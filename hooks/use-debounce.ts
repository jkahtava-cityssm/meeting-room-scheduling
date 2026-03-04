import { useState, useEffect } from "react";

export function useDebounce<T>(
  value: T,
  delay: number,
): {
  debouncedValue: T;
  isPending: boolean;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (value !== debouncedValue) {
      setIsPending(true);
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay, debouncedValue]);

  return { debouncedValue, isPending };
}
