import { ScrollArea } from "@/components/ui/scroll-area";

import { IEventCard, IRoomSection, ISection } from "./types";
import EventCard from "./event-card";
import { cva } from "class-variance-authority";
import { sharedColorVariants } from "@/components/ui/theme/colorVariants";
import { cn } from "@/lib/utils";
import { useEventPatchMutation } from "@/services/events";
import { useBookingContext } from "../context/BookingProvider";

export default function BookingList({ sections }: { sections: ISection[] }) {
  const breakpoints = true
    ? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
    : "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";

  return (
    <div className={`flex flex-1 flex-col ${breakpoints}`}>
      <ScrollArea className="max-h-[calc(100vh-180px)] overflow-y-auto" type="always">
        <div className="relative">
          <div className="flex flex-col gap-6 max-w-screen-2xl pr-4">
            {sections.map((section) => {
              return (
                <SectionLayout
                  key={section.sectionId}
                  formattedDate={section.formattedDate}
                  roomSections={section.roomSection}
                />
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function SectionLayout({ formattedDate, roomSections }: { formattedDate: string; roomSections: IRoomSection[] }) {
  //{format(date, "EEEE, MMMM d, yyyy")
  return (
    <div className="border-b">
      <div
        className="sticky top-0 bg-accent text-primary p-2 border-2 border-accent/50 shadow-sm  h-10 z-10"
        data-date={formattedDate}
      >
        <span className="flex-1 text-md">{formattedDate}</span>
      </div>

      <div className="grid">
        {roomSections.map((roomSection, idx) => {
          return <RoomSection key={roomSection.roomId} roomSection={roomSection} />;
        })}
      </div>
    </div>
  );
}

function RoomSection({ roomSection }: { roomSection: IRoomSection }) {
  const patchEvent = useEventPatchMutation();
  const { startDate, endDate, type, id } = useBookingContext();
  const badgeVariants = cva("", {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: "slate",
    },
  });

  return (
    <div className="w-full">
      <div
        className={cn(
          "sticky top-10 p-2  shadow-sm h-10 border-2 rounded-b-sm",
          badgeVariants({ color: roomSection.roomColour })
        )}
      >
        <span className={cn("flex-1 text-md")}> {roomSection.roomName}</span>
      </div>
      <div className="flex flex-wrap gap-4 p-4 ">
        {roomSection.eventCards.map((eventCard, idx) => {
          return (
            <EventCard
              key={String(eventCard.event.eventId)}
              eventCardFields={eventCard.eventCardFields}
              event={eventCard.event}
              OnApprove={() => {
                patchEvent.mutate({
                  eventId: eventCard.event.eventId,
                  updates: {
                    status: { connect: { statusId: 2 } },
                  },
                  cacheTags: { startDate: startDate, endDate: endDate, type: type, id: id },
                });
              }}
              OnDeny={() => {
                patchEvent.mutate({
                  eventId: eventCard.event.eventId,
                  updates: {
                    status: { connect: { statusId: 3 } },
                  },
                  cacheTags: { startDate: startDate, endDate: endDate, type: type, id: id },
                });
              }}
            ></EventCard>
          );
        })}
      </div>
    </div>
  );
}
