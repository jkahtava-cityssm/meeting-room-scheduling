import { cn } from "@/lib/utils";
import { isWorkingHour } from "../helpers";
import { TWorkingHours } from "../types";
import { AddEventDialog } from "./dialogs/add-event-dialog";

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

        <AddEventDialog startDate={day} startTime={{ hour, minute: 0 }}>
          <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </AddEventDialog>

        <AddEventDialog startDate={day} startTime={{ hour, minute: 15 }}>
          <div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </AddEventDialog>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>

        <AddEventDialog startDate={day} startTime={{ hour, minute: 30 }}>
          <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </AddEventDialog>

        <AddEventDialog startDate={day} startTime={{ hour, minute: 45 }}>
          <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </AddEventDialog>
      </div>
    );
  });
}
