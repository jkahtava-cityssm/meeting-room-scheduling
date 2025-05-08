"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { Period, TimePickerInput } from "./time-picker-input";
import { Label } from "./label";
import { TimePeriodSelect } from "./time-period-select";
import { cva, VariantProps } from "class-variance-authority";
import { Book, LucideProps } from "lucide-react";

import { TColors } from "@/components/calendar/lib/types";
import { twMerge } from "tailwind-merge";

const IconColor = cva("", {
  variants: {
    color: {
      // Colored and mixed variants
      red: "stroke-red-600 dark:stroke-red-800",
      orange: "stroke-orange-600 dark:stroke-orange-800",
      amber: "stroke-amber-600 dark:stroke-amber-800",
      yellow: "stroke-yellow-600 dark:stroke-yellow-800",
      lime: "stroke-lime-600 dark:stroke-lime-800",
      green: "stroke-green-600 dark:stroke-green-800",
      emerald: "stroke-emerald-600 dark:stroke-emerald-800",
      teal: "stroke-teal-600 dark:stroke-teal-800",
      cyan: "stroke-cyan-600 dark:stroke-cyan-800",
      sky: "stroke-sky-600 dark:stroke-sky-800",
      blue: "stroke-blue-600 dark:stroke-blue-800",
      indigo: "stroke-indigo-600 dark:stroke-indigo-800",
      violet: "stroke-violet-600 dark:stroke-violet-800",
      purple: "stroke-purple-600 dark:stroke-purple-800",
      fuchsia: "stroke-fuchsia-600 dark:stroke-fuchsia-800",
      pink: "stroke-pink-600 dark:stroke-pink-800",
      rose: "stroke-rose-600 dark:stroke-rose-800",
      slate: "stroke-slate-600 dark:stroke-slate-800",
      gray: "stroke-gray-600 dark:stroke-gray-800 ",
      zinc: "stroke-zinc-600 dark:stroke-zinc-800",
      neutral: "stroke-neutral-600 dark:stroke-neutral-800",
      stone: "stroke-stone-600 dark:stroke-stone-800 ",
    },
    background: {
      red: "bg-red-50",
      orange: "bg-orange-50 ",
      amber: "bg-amber-50",
      yellow: "bg-yellow-50",
      lime: "bg-lime-50",
      green: "bg-green-50",
      emerald: "bg-emerald-50 ",
      teal: "bg-teal-50",
      cyan: "bg-cyan-50 ",
      sky: "bg-sky-50",
      blue: "bg-blue-50",
      indigo: "bg-indigo-50",
      violet: "bg-violet-50",
      purple: "bg-purple-50",
      fuchsia: "bg-fuchsia-50",
      pink: "bg-pink-50",
      rose: "bg-rose-50",
      slate: "bg-slate-50 ",
      gray: "bg-gray-50",
      zinc: "bg-zinc-50",
      neutral: "bg-neutral-50 ",
      stone: "bg-stone-50",
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
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { className: cn(EventCardClasses) });
      }
    });
  };

  return (
    <div
      className={cn(
        EventCardClasses,
        showBorder
          ? "px-1.5 py-1.5 rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          : ""
      )}
    >
      {renderIcon()}
    </div>
  );
}

export { IconColored };
