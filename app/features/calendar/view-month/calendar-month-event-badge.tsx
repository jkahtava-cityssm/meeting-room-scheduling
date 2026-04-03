import { cva } from "class-variance-authority";
import { endOfDay, format, isSameDay, startOfDay } from "date-fns";

import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { IEventSingleRoom } from "@/lib/schemas";

import { sharedColorVariants } from "@/lib/theme/colorVariants";
import { Button } from "@/components/ui/button";
import { ButtonHTMLAttributes, forwardRef } from "react";

export const eventBadgeVariants = cva(
	" mx-1 flex size-auto h-6.5 select-none items-center justify-between gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",

	{
		variants: {
			color: sharedColorVariants,

			multiDayPosition: {
				first: "relative z-10 mr-0 w-[calc(100%_-_3px)] rounded-r-none border-r-0 [&>span]:mr-2.5",
				middle: "relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0",
				last: "ml-0 rounded-l-none border-l-0",
				single: "",
				none: "",
			},
		},
		defaultVariants: {
			color: "blue",
		},
	},
);

interface MonthEventBadgeProps
	extends Omit<VariantProps<typeof eventBadgeVariants>, "color" | "multiDayPosition">, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
	event: IEventSingleRoom;
	cellDate: Date;
	eventCurrentDay?: number;
	eventTotalDays?: number;
	className?: string;
	position?: "first" | "middle" | "last" | "none" | "single";
	userId?: string;
}

export const MonthEventBadge = forwardRef<HTMLButtonElement, MonthEventBadgeProps>(function MonthEventBadge(
	{ event, cellDate, eventCurrentDay, eventTotalDays, className, position: propPosition, userId, ...buttonProps },
	ref,
) {
	const itemStart = startOfDay(event.startDate);
	const itemEnd = endOfDay(event.endDate);

	if (cellDate < itemStart || cellDate > itemEnd) return null;

	let position: "first" | "middle" | "last" | "none" | "single" | undefined;

	if (propPosition) {
		position = propPosition;
	} else if (eventCurrentDay && eventTotalDays) {
		position = "none";
	} else if (isSameDay(itemStart, itemEnd)) {
		position = "none";
	} else if (isSameDay(cellDate, itemStart)) {
		position = "first";
	} else if (isSameDay(cellDate, itemEnd)) {
		position = "last";
	} else {
		position = "middle";
	}

	const renderBadgeText = ["first", "none"].includes(position);
	const renderDays = ["middle", "last"].includes(position);
	const renderStartTime = ["first", "none"].includes(position);
	const renderEndTime = ["last"].includes(position);

	const color = event.roomColor as VariantProps<typeof eventBadgeVariants>["color"];

	const eventBadgeClasses = cn(eventBadgeVariants({ color, multiDayPosition: position, className }));

	const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
		}
	};

	return (
		<button
			type="button"
			ref={ref}
			tabIndex={0}
			color={event.roomColor}
			className={cn("flex flex-1 appearance-none bg-transparent border-0 p-0 m-0 font-inherit text-inherit leading-none", eventBadgeClasses)}
			onKeyDown={handleKeyDown}
			aria-label={buttonProps["aria-label"] ?? event.title}
			{...buttonProps}
		>
			<div className="flex items-center gap-1.5 truncate">
				{renderDays && <span className="text-xs font-semibold truncate">{event.title}</span>}

				{renderBadgeText && <p className="flex-1 truncate font-semibold">{event.title}</p>}
			</div>
			{renderStartTime && <span className="hidden lg:block">{format(new Date(event.startDate), "h:mm a")}</span>}
			{renderEndTime && <span className="hidden lg:block">{format(new Date(event.endDate), "h:mm a")}</span>}
		</button>
	);
});
