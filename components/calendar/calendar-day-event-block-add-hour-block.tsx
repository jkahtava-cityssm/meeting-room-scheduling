import { cn } from "@/lib/utils";
import { isWorkingHour } from "../../lib/helpers";
import { TWorkingHours } from "../../lib/types";
import { AddEventDialog } from "./dialog-event-add";
import { AddEventDrawer } from "./dialog-event-add";

export function DayHourlyEventDialogs({
  hours,
  day,
  workingHours,
}: {
  hours: number[];
  day: Date;
  workingHours: TWorkingHours;
}) {
  return hours.map((hour, index) => {
    const isDisabled = !isWorkingHour(day, hour, workingHours);

    return (
      <div key={hour} className={cn("relative", isDisabled && "bg-calendar-disabled-hour")} style={{ height: "96px" }}>
        {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>}

        <AddEventDrawer startDate={day} startTime={{ hour, minute: 0 }}>
          <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </AddEventDrawer>

        <AddEventDrawer startDate={day} startTime={{ hour, minute: 15 }}>
          <div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </AddEventDrawer>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>

        <AddEventDrawer startDate={day} startTime={{ hour, minute: 30 }}>
          <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </AddEventDrawer>

        <AddEventDrawer startDate={day} startTime={{ hour, minute: 45 }}>
          <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </AddEventDrawer>
      </div>
    );
  });
}
