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

const IconColor = cva("", {
  variants: {
    color: {
      // Colored and mixed variants
      red: "bg-red-50 stroke-red-600 dark:stroke-red-800",
      orange: "bg-orange-50 stroke-orange-600 dark:stroke-orange-800",
      amber: "bg-amber-50 stroke-amber-600 dark:stroke-amber-800",
      yellow: "bg-yellow-50 stroke-yellow-600 dark:stroke-yellow-800",
      lime: "bg-lime-50 stroke-lime-600 dark:stroke-lime-800",
      green: "bg-green-50 stroke-green-600 dark:stroke-green-800",
      emerald: "bg-emerald-50 stroke-emerald-600 dark:stroke-emerald-800",
      teal: "bg-teal-50 stroke-teal-600 dark:stroke-teal-800",
      cyan: "bg-cyan-50 stroke-cyan-600 dark:stroke-cyan-800",
      sky: "bg-sky-50 stroke-sky-600 dark:stroke-sky-800",
      blue: "bg-blue-50 stroke-blue-600 dark:stroke-blue-800",
      indigo: "bg-indigo-50 stroke-indigo-600 dark:stroke-indigo-800",
      violet: "bg-violet-50 stroke-violet-600 dark:stroke-violet-800",
      purple: "bg-purple-50 stroke-purple-600 dark:stroke-purple-800",
      fuchsia: "bg-fuchsia-50 stroke-fuchsia-600 dark:stroke-fuchsia-800",
      pink: "bg-pink-50 stroke-pink-600 dark:stroke-pink-800",
      rose: "bg-rose-50 stroke-rose-600 dark:stroke-rose-800",
      slate: "bg-slate-50 stroke-slate-600 dark:stroke-slate-800",
      gray: "bg-gray-50 stroke-gray-600 dark:stroke-gray-800 ",
      zinc: "bg-zinc-50 stroke-zinc-600 dark:stroke-zinc-800",
      neutral: "bg-neutral-50 stroke-neutral-600 dark:stroke-neutral-800",
      stone: "bg-stone-50 stroke-stone-600 dark:stroke-stone-800 ",
    },
  },
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
    children,
  }: //className,
  //...props
  {
    color: TColors;
    children: React.ReactElement<SVGSVGElement>;
  } //& React.HTMLAttributes<HTMLDivElement> &
) {
  //Omit<LucideProps, "ref"> &
  //React.RefAttributes<SVGSVGElement>
  const EventCardClasses = IconColor({ color: color });

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
        "px-1.5 py-1.5 rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      )}
    >
      {renderIcon()}
    </div>
  );
}

export { IconColored };
