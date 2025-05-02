"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { Period, TimePickerInput } from "./time-picker-input";
import { Label } from "./label";
import { TimePeriodSelect } from "./time-period-select";
import { cva, VariantProps } from "class-variance-authority";
import { Book, LucideProps } from "lucide-react";

import { TColors } from "@/calendar/types";
import { twMerge } from "tailwind-merge";

const IconColor = cva("", {
  variants: {
    color: {
      // Colored and mixed variants
      red: "bg-red-600",
      orange: "bg-orange-600 ",
      amber: "bg-amber-600",
      yellow: "bg-yellow-600",
      lime: "bg-lime-600",
      green: "bg-green-600",
      emerald: "bg-emerald-600 ",
      teal: "bg-teal-600",
      cyan: "bg-cyan-600 ",
      sky: "bg-sky-600",
      blue: "bg-blue-600",
      indigo: "bg-indigo-600",
      violet: "bg-violet-600",
      purple: "bg-purple-600",
      fuchsia: "bg-fuchsia-600",
      pink: "bg-pink-600",
      rose: "bg-rose-600",
      slate: "bg-slate-600 ",
      gray: "bg-gray-600",
      zinc: "bg-zinc-600",
      neutral: "bg-neutral-600 ",
      stone: "bg-stone-600",
      none: "bg-none",
    },
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
