import { BadgeColored } from '@/components/ui/badge-colored';
import { Button } from '@/components/ui/button';
import { ButtonColored } from '@/components/ui/button-colored';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { IEventSingleRoom } from '@/lib/schemas';
import {
  CalendarRange,
  CalendarSync,
  ChevronRight,
  CirclePlus,
  Clock,
  Hourglass,
  Loader2,
  LucideCircleX,
  MapPin,
  Save,
  Send,
  SendHorizonal,
  Text,
} from 'lucide-react';

import { TColors, TStatusKey } from '@/lib/types';
import { IconColored } from '@/components/ui/icon-colored';
import DynamicIcon, { IconName } from '@/components/ui/icon-dynamic';
import { useSharedEventDrawer } from '../../event-drawer/drawer-context';

import { format } from 'date-fns';
import { getDurationText } from '@/lib/helpers';

import { BookingPermissions } from '../../bookings/components/permissions/booking.permissions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import React from 'react';
import { cn } from '@/lib/utils';

export const EventCard = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      event: IEventSingleRoom;
      index: number;
      onStatusChange: (id: number, newStatus: TStatusKey) => void;
      isUpdating: boolean;
    }
  >(({ event, index, onStatusChange, isUpdating }, ref) => {
    const { can } = BookingPermissions.usePermissions();

    const { openEventDrawer } = useSharedEventDrawer();

    const canReadEvent = can('ReadAllEvent');

    return (
      <div ref={ref} data-index={index} className="py-2">
        <Card
          className={cn(
            'h-145 w-100 flex flex-col overflow-hidden py-4 transition-all duration-200 relative',
            isUpdating && 'opacity-60 grayscale-[0.3] pointer-events-none select-none',
          )}
        >
          {isUpdating && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[1px]">
              <Loader2 className="animate-spin size-8 text-primary" />
            </div>
          )}
          <CardHeader className="min-w-0 space-y-3 shrink-0 px-4">
            <div className="flex flex-row w-full justify-between items-center min-w-0">
              <CardTitle className="truncate text-lg flex-1">{event.title}</CardTitle>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <BadgeColored color={event.status.color as TColors} className="shrink-0 max-w-full [&>svg]:size-4 p-1">
                <div className="size-4 shrink-0">
                  <DynamicIcon
                    hideBackground={true}
                    color={event.status.color as TColors}
                    name={event.status.icon as IconName}
                    className="size-4"
                  ></DynamicIcon>
                </div>
                <span className="truncate block">{event.status.name}</span>
              </BadgeColored>
              <div className="flex items-center gap-1">
                <SendHorizonal className="size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-foreground font-medium pl-1">{format(event.createdAt, 'PPP @ p')}</p>
              </div>
            </div>

            <CardDescription className="grid min-w-0 w-full ">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    {event.multiRoom ? (
                      <ScrollArea className="max-h-14 w-full rounded-md border border-transparent pr-3">
                        <div className="grid grid-cols-2 gap-1.5">
                          {event.eventRooms.map((room) => (
                            <div key={room.roomId} className="min-w-0">
                              <BadgeColored color={room.color as TColors} className="w-fit">
                                <span className="truncate block">{room.name}</span>
                              </BadgeColored>
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation="vertical" forceMount />
                      </ScrollArea>
                    ) : (
                      <div className="h-7">
                        <BadgeColored color={event.roomColor as TColors} className="w-fit">
                          <span className="truncate block ">{event.roomName}</span>
                        </BadgeColored>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <CalendarRange className="size-5 shrink-0" />
                  <p className="text-xs text-foreground font-medium pl-1">{formatDateRange(event)} </p>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="size-5 shrink-0" />
                  <p className="text-xs text-foreground font-medium pl-1">{formatTimeRange(event)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Hourglass className="size-5 shrink-0" />
                  <p className="text-xs text-foreground font-medium pl-1">{getDurationText(event.startDate, event.endDate)}</p>
                </div>
                {event.recurrence && (
                  <div className="flex items-center gap-1">
                    <CalendarSync className="size-5 shrink-0" />
                    <p className="text-xs text-foreground font-medium pl-1">{event.recurrence.description}</p>
                  </div>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 py-2  px-4">
            <div className="flex flex-col gap-1 h-full">
              <div className="flex items-center gap-2 mb-2">
                <Text className="size-5 shrink-0 text-muted-foreground " />

                <p className="text-xs text-foreground font-medium">Details</p>
              </div>
              <div className="flex items-center gap-2 pl-7">
                {event.description.length === 0 ? (
                  <div className="flex items-center justify-center w-full min-h-25 rounded-md border border-dashed border-muted-foreground/25 bg-muted/30">
                    <p className="text-sm uppercase italic text-muted-foreground/70">No Description</p>
                  </div>
                ) : (
                  <p className="text-xs text-foreground line-clamp-6 min-h-24 py-1 leading-relaxed">{event.description}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-4 mt-auto">
            <div className="flex flex-col w-full gap-2">
              {/* Top Row: The two available status actions */}
              <div className="grid grid-cols-2 gap-2">
                {event.status.name !== 'Confirmed' && (
                  <ButtonColored
                    color="green"
                    size="sm"
                    className="w-full"
                    onClick={() => onStatusChange(event.eventId, 'APPROVED')}
                    disabled={isUpdating}
                  >
                    Confirm
                  </ButtonColored>
                )}
                {event.status.name !== 'Rejected' && (
                  <ButtonColored
                    color="red"
                    size="sm"
                    className="w-full"
                    onClick={() => onStatusChange(event.eventId, 'REJECTED')}
                    disabled={isUpdating}
                  >
                    Reject
                  </ButtonColored>
                )}
                {event.status.name !== 'Pending Review' && (
                  <ButtonColored
                    color="slate"
                    size="sm"
                    className="w-full"
                    onClick={() => onStatusChange(event.eventId, 'PENDING')}
                    disabled={isUpdating}
                  >
                    Pending
                  </ButtonColored>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  if (canReadEvent) {
                    openEventDrawer({ creationDate: new Date(event.startDate), event: event });
                  }
                }}
                disabled={isUpdating}
              >
                View Event Details
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }),
);

function formatDateRange(event: IEventSingleRoom) {
  if (event.recurrence && event.recurrence.startDate && event.recurrence.endDate) {
    return `${format(event.recurrence.startDate, 'PPP')} - ${format(event.recurrence.endDate, 'PPP')}`;
  } else if (event.multiDay) {
    return event.multiDay.position === 'middle' ? `${format(event.startDate, 'PP')}` : format(event.startDate, 'PP @ p');
  } else {
    return format(event.startDate, 'PPP');
  }
}

function formatTimeRange(event: IEventSingleRoom) {
  if (event.recurrence && event.recurrence.startDate && event.recurrence.endDate) {
    return `${format(event.startDate, 'p')} - ${format(event.endDate, 'p')}`;
  } else if (event.multiDay) {
    return event.multiDay.position === 'middle' ? `All Day` : format(event.endDate, 'PP @ p');
  } else {
    return `${format(event.startDate, 'p')} - ${format(event.endDate, 'p')}`;
  }
}
