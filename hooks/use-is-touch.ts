'use client';

import * as React from 'react';

export function useIsTouch() {
  const [isTouch, setIsTouch] = React.useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false,
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: coarse)');
    const handler = () => setIsTouch(mq.matches);
    // modern browsers fire 'change' on MediaQueryList
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return isTouch;
}
