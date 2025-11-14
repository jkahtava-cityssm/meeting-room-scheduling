import { ScrollArea } from "@/components/ui/scroll-area";

import { IEventCard, IRoomSection, ISection } from "./types";
import EventCard from "./event-card";
import { cva } from "class-variance-authority";
import { sharedColorVariants } from "@/components/ui/theme/colorVariants";
import { cn } from "@/lib/utils";

export default function BookingList({ sections }: { sections: ISection[] }) {
  const breakpoints = true
    ? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
    : "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";

  return (
    <div className={`flex flex-1 flex-col ${breakpoints}`}>
      <ScrollArea className="min-h-[40vh] max-h-[70vh] overflow-y-auto" type="always">
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
      <div className="sticky top-0 bg-primary text-accent p-2  shadow-sm  h-10 z-10" data-date={formattedDate}>
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
        className={cn("sticky top-10 p-2  shadow-sm h-10 border-2", badgeVariants({ color: roomSection.roomColour }))}
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
              OnApprove={function (): void {
                throw new Error("Function not implemented.");
              }}
              OnDeny={function (): void {
                throw new Error("Function not implemented.");
              }}
            ></EventCard>
          );
        })}
      </div>
    </div>
  );
}
