import { format } from "date-fns";

export function HourColumn({ hours }: { hours: number[] }) {
  return (
    <div className="relative w-18 border-r">
      {hours.map((hour, index) => (
        <div key={hour} className="relative" style={{ height: "96px" }}>
          <div className="absolute -top-3 right-2 flex h-6 items-center">
            {index !== 0 && (
              <span className="text-xs text-muted-foreground">{format(new Date().setHours(hour), "hh a")}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
