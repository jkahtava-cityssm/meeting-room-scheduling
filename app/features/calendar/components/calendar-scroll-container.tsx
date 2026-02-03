import React, { useRef } from "react";
import { SharedEventDrawerProvider } from "../../event-drawer/shared-event-drawer-context";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarHourTimeline } from "./calendar-hour-timeline";
import { format } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { CalendarScrollProvider } from "./calendar-scroll-context";

export type CalendarScrollContainerProps = {
  isLoading: boolean;
  hours: number[];
  isMounting: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
};

export function CalendarScrollContainerPrivate(props: CalendarScrollContainerProps) {
  return (
    <SharedEventDrawerProvider>
      <CalendarScrollContainerBase {...props} />
    </SharedEventDrawerProvider>
  );
}

export function CalendarScrollContainerPublic(props: CalendarScrollContainerProps) {
  return <CalendarScrollContainerBase {...props} />;
}

const CalendarScrollContainerBase = React.memo(function CalendarScrollContainerBase({
  isLoading,
  isMounting,
  hours,
  skeleton,
  children,
}: CalendarScrollContainerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  if (isMounting) {
    return <div className="flex">{skeleton}</div>;
  }

  return (
    <CalendarScrollProvider value={viewportRef}>
      <ScrollArea className="w-full flex-1 min-h-0" type="always">
        <div
          className="relative flex min-w-0 w-full"
          ref={(el) => {
            // Try to find the radix viewport inside this ScrollArea
            viewportRef.current = el?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
          }}
        >
          <HourColumn hours={hours} />

          <div className="flex w-full min-w-0 pr-4">{children}</div>
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col bg-accent-foreground text-accent px-4 py-2 rounded ">
              <LoaderCircle className="animate-spin" />
            </div>
          </div>
        )}
        <ScrollBar orientation="vertical" forceMount />
        <ScrollBar orientation="horizontal" forceMount />
      </ScrollArea>
    </CalendarScrollProvider>
  );
});

const HourColumn = React.memo(function HourColumn({ hours }: { hours: number[] }) {
  const lastHour = hours.length > 0 ? hours[hours.length - 1] + 1 : 0;

  return (
    <div className="sticky left-0 z-10 bg-background min-w-18 border-r-2 pr-2 border-b-2  shrink-0 pt-8">
      <div className=" pt-1.5">
        <CalendarHourTimeline hours={hours} />
        {hours.map((hour, index) => {
          return (
            <div key={hour} className="h-24 flex items-start pr-2">
              <span className="ml-auto -mt-2 text-xs text-muted-foreground">
                {format(new Date().setHours(hour), "hh a")}
              </span>
            </div>
          );
        })}
        <div className={"h-4 flex items-start pr-2"}>
          <span className="ml-auto -mt-2 text-xs text-muted-foreground">
            {format(new Date().setHours(lastHour), "hh a")}
          </span>
        </div>
      </div>
    </div>
  );
});
