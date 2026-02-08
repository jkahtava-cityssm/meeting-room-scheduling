import { cn } from "@/lib/utils";
import { IMonthDayView } from "../webworkers/generic-webworker";

export function MonthViewDayFooter({ dayRecord }: { dayRecord: IMonthDayView }) {
	return (
		<div className={cn("flex h-full flex-col gap-1 border-l py-1 overflow-hidden", dayRecord.isSunday && "border-l-0")}>
			<p className={cn("h-4.5 px-1.5 text-xs font-semibold text-muted-foreground", !dayRecord.isCurrentMonth && "opacity-50")}>
				{dayRecord.totalEvents > 0 && <span className="sm:hidden">+{dayRecord.totalEvents}</span>}
				{dayRecord.totalEvents > 3 && <span className="hidden sm:block"> {dayRecord.totalEvents} events</span>}
			</p>
		</div>
	);
}
