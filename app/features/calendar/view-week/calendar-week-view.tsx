'use client';

import { format, parse } from 'date-fns';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';

import { useEffect, useMemo } from 'react';

import { CalendarScrollContainerPrivate } from '../components/calendar-scroll-container';
import { CalendarScrollColumnPrivate } from '../components/calendar-scroll-column';

import { cn } from '@/lib/utils';
import { usePrivateCalendarEvents } from '../webworkers/use-calendar-private-events';
import { IEventBlock } from '../webworkers/generic-webworker';
import { CalendarScrollContainerSkeleton } from '../components/calendar-scroll-container-skeleton';
import { GenericError } from '../../../../components/shared/generic-error';

export function CalendarWeekView({ date, userId }: { date: Date; userId?: string }) {
  const {
    interval,
    visibleHours,
    maxSpan,
    fallbackHours,
    visibleRooms,
    selectedRoomIds,
    selectedStatusKeys,
    configurationError,
    roomError,
    setIsHeaderLoading,
    setTotalEvents,
  } = usePrivateCalendar();

  const roomIds = useMemo(() => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []), [visibleRooms]);

  const { result, isLoading, error } = usePrivateCalendarEvents('WEEK', date, visibleHours, userId, selectedRoomIds, selectedStatusKeys);

  useEffect(() => {
    if (isLoading) {
      setIsHeaderLoading(true);
    }

    if (result && !isLoading) {
      setIsHeaderLoading(false);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  useEffect(() => {
    if (!result) return;

    setTotalEvents(result.totalEvents);
  }, [result, setTotalEvents]);

  //const lastRoomId = roomsToRender?.length ? roomsToRender[roomsToRender.length - 1].roomId : undefined;

  const daysToRender = useMemo(() => {
    const daysToRender: { date: string; blocks: IEventBlock[] }[] = [];

    for (const dateKey in result?.data.dayBlocks) {
      const dayBlock = result?.data.dayBlocks[dateKey];

      /*let filteredRooms: [string, IEventBlock[]][];

      if (selectedRoomIds.includes("-1")) {
        filteredRooms = dayBlock["-1"] ? [["-1", dayBlock["-1"]]] : [];
      } else {
        // Only include the selected room
        filteredRooms = selectedRoomIds.map((roomId) => (dayBlock[roomId] ? [roomId, dayBlock[roomId]] : [roomId, []]));
      }*/

      //const flatBlocks = filteredRooms.flatMap(([_, blocks]) => blocks);
      daysToRender.push({ date: dateKey, blocks: dayBlock });
    }

    return daysToRender;
  }, [result]);

  const isMounting = !visibleRooms || !result || false;

  if (error || configurationError || roomError) {
    return <GenericError error={error} />;
  }

  return (
    <>
      <div className="flex flex-1 min-h-0">
        <div className={cn('flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1')}>
          {isMounting ? (
            <>
              <CalendarScrollContainerSkeleton hours={fallbackHours} totalColumns={7} />
            </>
          ) : (
            <CalendarScrollContainerPrivate isLoading={isLoading} hours={result?.data.hours || []}>
              {daysToRender?.map((day, dayIndex) => {
                return (
                  <CalendarScrollColumnPrivate
                    key={day.date}
                    loadingBlocks={isLoading}
                    title={format(parse(day.date, 'yyyy-MM-dd', new Date()), 'EE d')}
                    interval={interval}
                    roomId={undefined}
                    userId={userId}
                    hours={result?.data.hours || []}
                    eventBlocks={day.blocks || []}
                    isLastColumn={daysToRender.length - 1 === dayIndex}
                    currentDate={parse(day.date, 'yyyy-MM-dd', new Date())}
                    maxHour={visibleHours ? visibleHours.to : 24}
                    minHour={visibleHours ? visibleHours.from : 0}
                    maxSpan={maxSpan}
                  />
                );
              })}
            </CalendarScrollContainerPrivate>
          )}
        </div>
      </div>
    </>
  );
}
