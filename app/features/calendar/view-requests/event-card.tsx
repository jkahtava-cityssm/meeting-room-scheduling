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
  LucideCircleX,
  MapPin,
  Save,
  Send,
  SendHorizonal,
  Text,
} from 'lucide-react';

import { TColors } from '@/lib/types';
import { IconColored } from '@/components/ui/icon-colored';
import DynamicIcon, { IconName } from '@/components/ui/icon-dynamic';
import { useSharedEventDrawer } from '../../event-drawer/drawer-context';

import { format } from 'date-fns';
import { getDurationText } from '@/lib/helpers';

import { BookingPermissions } from '../../bookings/components/permissions/booking.permissions';

export default function EventCard({
  event,
  OnApprove,
  OnDeny,
  OnPending,
}: {
  event: IEventSingleRoom;
  OnApprove: () => void;
  OnDeny: () => void;
  OnPending: () => void;
}) {
  const { can } = BookingPermissions.usePermissions();

  const { openEventDrawer } = useSharedEventDrawer();

  const canReadEvent = can('ReadAllEvent');

  return (
    <Card className="w-full min-w-min max-w-100">
      <CardHeader className="min-w-0 space-y-3 overflow-hidden">
        <div className="flex flex-row w-full justify-between items-center min-w-0">
          <CardTitle className="truncate text-lg flex-1">{event.title}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
          <BadgeColored color={event.status.color as TColors} className="shrink-0 max-w-full [&>svg]:size-4 p-1">
            <DynamicIcon hideBackground={true} color={event.status.color as TColors} name={event.status.icon as IconName}></DynamicIcon>
            <span className="truncate block">{event.status.name}</span>
          </BadgeColored>
          <div className="flex items-center gap-1">
            <SendHorizonal className="size-5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-foreground font-medium pl-1">{format(event.createdAt, 'PPP @ p')}</p>
          </div>
        </div>

        <CardDescription className="grid min-w-0 w-full">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                {event.multiRoom ? (
                  <div className="grid grid-cols-2 gap-1.5 pb-2 mb-1">
                    {event.eventRooms.map((room) => (
                      <div key={room.roomId} className="min-w-0">
                        <BadgeColored color={room.color as TColors} className="w-fit">
                          <span className="truncate block">{room.name}</span>
                        </BadgeColored>
                      </div>
                    ))}
                  </div>
                ) : (
                  <BadgeColored color={event.roomColor as TColors} className="w-fit">
                    <span className="truncate block ">{event.roomName}</span>
                  </BadgeColored>
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
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <Text className="size-5 shrink-0 text-muted-foreground " />
            <div>
              <p className="text-xs text-foreground font-medium">Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-7">
            {event.description.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full min-h-24 rounded-md border border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-2 gap-2">
                <p className="text-sm uppercase tracking-wider font-semibold text-muted-foreground/70 mb-1">No Description</p>
              </div>
            ) : (
              <p className="text-xs text-foreground line-clamp-6 min-h-24 py-1 leading-relaxed">{event.description}</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-auto">
        {event.status.name !== 'Confirmed' && (
          <ButtonColored color="green" className="w-full sm:w-1/3" onClick={OnApprove}>
            Confirm
          </ButtonColored>
        )}
        {event.status.name !== 'Rejected' && (
          <ButtonColored color="red" className="w-full sm:w-1/3" onClick={OnDeny}>
            Reject
          </ButtonColored>
        )}
        {event.status.name !== 'Pending Review' && (
          <ButtonColored color="slate" className="w-full sm:w-1/3" onClick={OnPending}>
            Pending
          </ButtonColored>
        )}

        <Button
          variant={'outline'}
          className="w-full sm:w-1/3"
          onClick={(e) => {
            e.preventDefault();
            if (canReadEvent) {
              openEventDrawer({ creationDate: new Date(event.startDate), event: event });
            }
          }}
        >
          Review
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <Card className="w-100 p-2 flex flex-col">
      <CardHeader className="min-w-0 overflow-hidden space-y-4">
        <CardTitle className="pb-2 mb-1 border-b">
          <div className="flex flex-row w-full justify-between items-center gap-2">
            {/* Status Badge */}
            <div className="min-w-0 shrink-0 ">
              <BadgeColored color={event.status.color as TColors} className="flex items-center gap-1">
                <DynamicIcon hideBackground color={event.status.color as TColors} name={event.status.icon as IconName} />
                <span className="truncate">{event.status.name}</span>
              </BadgeColored>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
            <SendHorizonal className="size-4 shrink-0" />
            <p className="text-xs font-medium">{format(event.createdAt, 'PPP @ p')}</p>
          </div>
        </CardTitle>

        <CardTitle className="text-lg font-bold truncate">{event.title}</CardTitle>

        <CardDescription className="space-y-2">
          {/* Location / Multi-Room Logic */}
          <div className="flex items-start gap-2">
            <MapPin className="size-4 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              {event.multiRoom ? (
                <div className="grid grid-cols-2 gap-2 border-b pb-2 mb-1">
                  {event.eventRooms.map((room) => (
                    <div key={room.roomId} className="min-w-0">
                      <BadgeColored color={room.color as TColors} className="w-full">
                        <span className="truncate block text-[10px]">{room.name}</span>
                      </BadgeColored>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground font-medium">{event.roomName}</p>
              )}
            </div>
          </div>

          {/* Date & Time Info */}
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2 text-xs text-foreground font-medium">
              <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
              <span>{formatDateRange(event)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground font-medium">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <span>{formatTimeRange(event)}</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Text className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Details</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed line-clamp-4 pl-6">{event.description || 'No description provided.'}</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
        <div className="flex flex-1 gap-2">
          {event.status.name !== 'Confirmed' && (
            <ButtonColored color="green" className="flex-1" onClick={OnApprove}>
              Confirm
            </ButtonColored>
          )}
          {event.status.name !== 'Rejected' && (
            <ButtonColored color="red" className="flex-1" onClick={OnDeny}>
              Reject
            </ButtonColored>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={(e) => {
            e.preventDefault();
            if (canReadEvent) openEventDrawer({ creationDate: new Date(event.startDate), event });
          }}
        >
          Review
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatDateRange(event: IEventSingleRoom) {
  if (event.recurrence && event.recurrence.startDate && event.recurrence.endDate) {
    return `${format(event.recurrence.startDate, 'PPP')} - ${format(event.recurrence.endDate, 'PPP')}`;
  } else if (event.multiDay) {
    return event.multiDay.position === 'middle' ? `${format(event.startDate, 'PP')}` : format(event.startDate, 'PP @ p');
  } else {
    format(event.startDate, 'PPP');
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
