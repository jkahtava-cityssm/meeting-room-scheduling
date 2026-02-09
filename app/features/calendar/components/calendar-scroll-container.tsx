import React, { useMemo, useRef, useState } from "react";
import { SharedEventDrawerProvider } from "../../event-drawer/shared-event-drawer-context";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarHourTimeline } from "./calendar-scroll-hour-timeline";
import { format } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { CalendarScrollProvider, useCalendarViewport } from "./calendar-scroll-context";
import { CalendarScrollColumnSkeleton } from "./calendar-scroll-column-skeleton";

export type CalendarScrollContainerProps = {
  isLoading: boolean;
  hours: number[];

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
  hours,

  children,
}: CalendarScrollContainerProps) {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [popoverLayer, setPopoverLayer] = useState<HTMLDivElement | null>(null);

  // 2. Memoize the value for the provider
  const contextValue = useMemo(
    () => ({
      viewport,
      popoverLayer,
    }),
    [viewport, popoverLayer],
  );

  return (
    <CalendarScrollProvider value={contextValue}>
      <ScrollArea
        className="w-full flex-1 min-h-0"
        type="always"
        viewportRef={setViewport}
        popoverLayerRef={setPopoverLayer}
      >
        <div className="relative flex min-w-0 w-full">
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
  const lastItem = hours?.at(-1);
  const lastHour = lastItem == null ? 0 : lastItem + 1;

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
