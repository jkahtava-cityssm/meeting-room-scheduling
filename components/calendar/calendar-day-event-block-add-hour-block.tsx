import { cn } from "@/lib/utils";
import { isWorkingHour } from "../../lib/helpers";
import { TWorkingHours } from "../../lib/types";
import EventDrawer from "../event-drawer/event-drawer";

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

        <EventDrawer creationDate={getDateTime(day, hour, 0)}>
          <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </EventDrawer>

        <EventDrawer creationDate={getDateTime(day, hour, 15)}>
          <div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </EventDrawer>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>

        <EventDrawer creationDate={getDateTime(day, hour, 30)}>
          <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </EventDrawer>

        <EventDrawer creationDate={getDateTime(day, hour, 45)}>
          <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
        </EventDrawer>
      </div>
    );
  });
}

function getDateTime(date: Date, hour: number, minute: number) {
  const newDate = new Date(date);
  newDate.setHours(hour, minute, 0, 0);
  return newDate;
}
