"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { TColors } from "@/lib/types";
import { sharedIconBackgrounVariants, sharedIconColorVariants } from "./eventCardVariants";

const IconColor = cva("", {
	variants: {
		color: sharedIconColorVariants,
		background: sharedIconBackgrounVariants,
	},
	compoundVariants: [],
	defaultVariants: {
		color: "blue",
	},
});

/*
HTMLAttributes<HTMLDivElement>, Omit<VariantProps<typeof EventCard>, "color">

React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<SVGSVGElement>
*/
// &Omit<VariantProps<typeof IconColor>, "color">;

function IconColored(
	{
		color,
		showBorder = false,
		hideBackground = false,
		children,
	}: //className,
	//...props
	{
		color: TColors;
		showBorder: boolean;
		hideBackground: boolean;
		children: React.ReactElement<SVGSVGElement>;
	} //& React.HTMLAttributes<HTMLDivElement> &
) {
	//Omit<LucideProps, "ref"> &
	//React.RefAttributes<SVGSVGElement>
	const EventCardClasses = IconColor({ color: color, background: hideBackground ? "none" : color });

	const renderIcon = () => {
		return React.Children.map(children, child => {
			if (React.isValidElement(child)) {
				return React.cloneElement(child, { className: cn(EventCardClasses) });
			}
		});
	};

	return (
		<div
			className={cn(
				EventCardClasses,
				showBorder ? "px-1.5 py-1.5 rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" : ""
			)}
		>
			{renderIcon()}
		</div>
	);
}

export { IconColored };
