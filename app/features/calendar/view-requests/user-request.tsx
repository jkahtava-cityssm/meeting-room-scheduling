'use client';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';

import { useEffect, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { CalendarDayColumnCalendar } from '../sidebar-day-picker/calendar-day-column-calendar';

import { usePrivateCalendarEvents } from '../webworkers/use-calendar-private-events';
import { CalendarScrollContainerPrivate } from '../components/calendar-scroll-container';
import { CalendarScrollColumnPrivate } from '../components/calendar-scroll-column';

import { CalendarScrollContainerSkeleton } from '../components/calendar-scroll-container-skeleton';

import { LoaderCircle, LucideCalendarDays, Terminal } from 'lucide-react';
import { GenericError } from '../../../../components/shared/generic-error';

import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { IRequestGroup } from '../webworkers/generic-webworker';
import { useEventPatchMutation } from '@/lib/services/events';
import { sharedColorVariants } from '@/lib/theme/colorVariants';
import { cva } from 'class-variance-authority';
import EventCard from './event-card';

export function CalendarUserRequestView({ date, userId }: { date: Date; userId?: string }) {
  const {
    interval,
    maxSpan,
    visibleHours,
    fallbackHours,
    visibleRooms,
    selectedRoomIds,
    selectedStatusKeys,
    configurationError,
    roomError,
    setIsHeaderLoading,
    setTotalEvents,
    statusLookup,
  } = usePrivateCalendar();

  const roomIds = useMemo(() => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []), [visibleRooms]);

  const { result, isLoading, error } = usePrivateCalendarEvents('DAY', date, visibleHours, userId, roomIds, selectedStatusKeys, true, 'booking');

  useEffect(() => {
    if (isLoading) {
      setIsHeaderLoading(true);
    }

    if (result && !isLoading) {
      setIsHeaderLoading(false);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  const isEmpty = false;
  const isMounting = false;

  return (
    <div className="flex flex-1 min-h-0">
      <div className={cn('flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1')}>
        {isMounting ? (
          <></>
        ) : (
          <ScrollArea className="w-full flex-1 min-h-0" type="always">
            <div className="flex w-full min-w-0 pr-4">
              {result?.data?.requestSections?.map((section) => {
                return (
                  <div key={section.sectionId} className="border-b">
                    <div
                      className="sticky top-0 bg-accent text-primary p-2 border-2 border-accent/50 shadow-sm  h-10 z-10"
                      data-date={section.sectionTitle}
                    >
                      <span className="flex-1 text-md">{section.sectionTitle}</span>
                    </div>

                    <div className="grid">
                      {section.sectionGroups.map((groupSection, idx) => {
                        return <GroupSection key={groupSection.groupId} requestGroup={groupSection} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col bg-accent-foreground text-accent px-4 py-2 rounded ">
                  <LoaderCircle className="animate-spin" />
                </div>
              </div>
            )}
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia>
                        <LucideCalendarDays />
                      </EmptyMedia>
                      <EmptyTitle>No Rooms Selected</EmptyTitle>
                      <EmptyDescription>Please reset the filters or select a room</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              </div>
            )}

            <ScrollBar orientation="vertical" forceMount />
            <ScrollBar orientation="horizontal" forceMount />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

function GroupSection({ requestGroup }: { requestGroup: IRequestGroup }) {
  const { statusLookup } = usePrivateCalendar();
  const patchEvent = useEventPatchMutation();

  const badgeVariants = cva('', {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: 'slate',
    },
  });

  return (
    <div className="w-full">
      <div className={cn('sticky top-10 p-2  shadow-sm h-10 border-2 rounded-b-sm', badgeVariants({ color: requestGroup.groupColor }))}>
        <span className={cn('flex-1 text-md')}> {requestGroup.groupName}</span>
      </div>
      <div className="flex flex-wrap gap-4 p-4 ">
        {requestGroup.groupEvents.map((event, idx) => {
          return (
            <EventCard
              key={String(event.eventId)}
              event={event}
              OnPending={() => {
                patchEvent.mutate({
                  data: { eventId: event.eventId, statusId: statusLookup('PENDING') },
                });
              }}
              OnApprove={() => {
                patchEvent.mutate({
                  data: { eventId: event.eventId, statusId: statusLookup('APPROVED') },
                });
              }}
              OnDeny={() => {
                patchEvent.mutate({
                  data: { eventId: event.eventId, statusId: statusLookup('REJECTED') },
                });
              }}
            ></EventCard>
          );
        })}
      </div>
    </div>
  );
}
