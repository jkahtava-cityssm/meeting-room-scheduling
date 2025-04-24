import { format } from "date-fns";

export function ColumnDayHeader({ weekDays }: { weekDays: Date[] }) {
  return (
    <div className="relative z-20 flex border-b">
      <div className="w-18"></div>
      <div className={`grid flex-1 grid-cols-${weekDays.length} divide-x border-l`}>
        {weekDays.map((day, index) => (
          <span key={index} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {format(day, "EE")} <span className="ml-1 font-semibold text-foreground">{format(day, "d")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
