"use client";

import { format } from "date-fns";
import { cva } from "class-variance-authority";
import { Clock, MapPin, Text } from "lucide-react";

import { TColors } from "@/lib/types";
import { IEvent } from "@/lib/schemas/calendar";
import EventDrawer from "../event-drawer/event-drawer";
import { sharedColorVariants } from "../ui/eventCardVariants";

const agendaEventCardVariants = cva(
  "flex select-none items-center justify-between gap-3 rounded-md border p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      color: sharedColorVariants,
      /*{
        red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 [&_.event-dot]:fill-red-600",
        orange:
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 [&_.event-dot]:fill-orange-600",
        amber:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 [&_.event-dot]:fill-amber-600",
        yellow:
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 [&_.event-dot]:fill-yellow-600",
        lime: "border-lime-200 bg-lime-50 text-lime-700 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-300 [&_.event-dot]:fill-lime-600",
        green:
          "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300 [&_.event-dot]:fill-green-600",
        emerald:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 [&_.event-dot]:fill-emerald-600",
        teal: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300 [&_.event-dot]:fill-teal-600",
        cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 [&_.event-dot]:fill-cyan-600",
        sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300 [&_.event-dot]:fill-sky-600",
        blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 [&_.event-dot]:fill-blue-600",
        indigo:
          "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 [&_.event-dot]:fill-indigo-600",
        violet:
          "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300 [&_.event-dot]:fill-violet-600",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 [&_.event-dot]:fill-purple-600",
        fuchsia:
          "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300 [&_.event-dot]:fill-fuchsia-600",
        pink: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-300 [&_.event-dot]:fill-pink-600",
        rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300 [&_.event-dot]:fill-rose-600",
        slate:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 [&_.event-dot]:fill-slate-600",
        gray: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 [&_.event-dot]:fill-gray-600",
        zinc: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 [&_.event-dot]:fill-zinc-600",
        neutral:
          "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 [&_.event-dot]:fill-neutral-600",
        stone:
          "border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300 [&_.event-dot]:fill-stone-600",
      },*/
    },
    defaultVariants: {
      color: "blue",
    },
  }
);

export function AgendaEventCard({ event, userId }: { event: IEvent; userId?: string }) {
  //const { badgeVariant } = useCalendar();

  const startDate = event.startDate;
  const endDate = event.endDate;
  /*
  const color = (badgeVariant === "dot" ? `${event.color}-dot` : event.color) as VariantProps<
    typeof agendaEventCardVariants
  >["color"];
*/
  const color = event.room.color as TColors;
  const agendaEventCardClasses = agendaEventCardVariants({ color });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <EventDrawer event={event} userId={userId}>
      <div
        role="button"
        tabIndex={0}
        className={agendaEventCardClasses}
        color={event.room.color}
        onKeyDown={handleKeyDown}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <p className="text-md leading-none font-semibold">{event.title}</p>
          </div>

          <div className="mt-1 flex items-center gap-1">
            <MapPin className="size-5 shrink-0" />
            <p className="text-xs text-foreground">{event.room.name}</p>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="size-5 shrink-0" />
            <p className="text-xs text-foreground">
              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Text className="size-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Description</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-7">
              <p className="text-xs text-foreground">{event.description}</p>
            </div>
          </div>
        </div>
      </div>
    </EventDrawer>
  );
}
