'use client';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { TIME_BLOCK_SIZE, TVisibleHours } from '@/lib/types';

export function CalendarHourTimeline({ hours }: { hours: number[] }) {
  //The date is not initially set because the server and clients time is not always consistent.
  //because this component updates on the minute if the state is initially set it will throw a hydration error
  //when getting close to the next minute so at 00:00:55 it will cross to the next minute boundary while hydrating causing a mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const visibleHours = { from: hours ? hours[0] : 0, to: hours ? hours[hours.length - 1] + 1 : 0 };

  useEffect(() => {
    const updateDateTime = new Date();
    const nextUpdate = updateDateTime.getSeconds();
    const secondsRemaining = 60 - nextUpdate + 2;

    const setTime = () => setCurrentTime(new Date());

    let timer: NodeJS.Timeout;
    setTime();
    const timeout = setTimeout(() => {
      setTime();
      timer = setInterval(() => setTime(), 60 * 1000);
    }, secondsRemaining * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, []);

  if (!currentTime || !hours) return null;

  const currentHour = currentTime.getHours();
  if (currentHour < visibleHours.from || currentHour >= visibleHours.to) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-5 border-t border-primary"
      style={{ top: `calc(${getCurrentTimePosition(currentTime, visibleHours, hours)}px)` }}
    >
      <div className="absolute left-18 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"></div>
      <div className="absolute left-0 border-2 rounded-sm flex w-16 -translate-y-1/2  bg-background pl-1 text-xs font-medium text-primary">
        {format(currentTime, 'hh:mm a')}
      </div>
    </div>
  );
}

const getCurrentTimePosition = (currentTime: Date, visibleHours: TVisibleHours, hours: number[]) => {
  const padding = 38;
  const index = hours.indexOf(currentTime.getHours());
  const minutes2 = currentTime.getMinutes();
  const block = index * TIME_BLOCK_SIZE;
  const minute = (TIME_BLOCK_SIZE / 60) * minutes2;

  const position = block + minute + padding;

  return position;
};
