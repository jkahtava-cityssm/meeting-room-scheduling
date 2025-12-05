"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

import { TColors } from "@/lib/types";
import { sharedIconDotVariants } from "../../lib/theme/colorVariants";

const IconColor = cva("", {
  variants: {
    color: sharedIconDotVariants,
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

function IconDot({
  color,
  ...props
}: //className,
//...props
{
  color: TColors;
}) {
  //Omit<LucideProps, "ref"> &
  //React.RefAttributes<SVGSVGElement>
  const EventCardClasses = IconColor({ color: color });

  return <div {...props} className={cn("size-1.5 rounded-full", EventCardClasses)} />;
}

export { IconDot };
