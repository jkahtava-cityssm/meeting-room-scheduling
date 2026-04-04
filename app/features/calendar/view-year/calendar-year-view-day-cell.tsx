'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import { IconDot } from '@/components/ui/icon-dot';
import { TColors } from '@/lib/types';

import { navigateURL } from '@/lib/helpers';
import { IYearDayView } from '../webworkers/generic-webworker';

const YearViewDayCell = ({ day, userId }: { day: IYearDayView; userId?: string }) => {
  const { push } = useRouter();

  const maxIndicators = 3;

  const handleClick = () => {
    push(navigateURL(new Date(day.dayDate), 'day'));
  };

  const indicatorList = userId ? day.dayEvents.filter((event) => String(event.userId) === userId) : day.dayEvents;

  return (
    <button
      onClick={handleClick}
      type="button"
      className="flex h-11 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-xs font-medium',
          day.isToday && 'bg-primary font-semibold text-primary-foreground',
        )}
      >
        {day.day}
      </div>
      {
        <div className="mt-0.5 flex gap-0.5">
          {indicatorList.length <= maxIndicators ? (
            indicatorList.map((event, index) => (
              <IconDot key={`day-${day.day}-${event.eventId}-${index}`} color={event.roomColor as TColors}></IconDot>
            ))
          ) : (
            <>
              <div className="flex justify-center items-center">
                <IconDot key={`day-${day.day}-${indicatorList[0].eventId}`} color={indicatorList[0].roomColor as TColors}></IconDot>
              </div>

              <span className="text-[0.5rem] ">+ {indicatorList.length - 1}</span>
            </>
          )}
        </div>
      }
    </button>
  );
};

export default YearViewDayCell;
