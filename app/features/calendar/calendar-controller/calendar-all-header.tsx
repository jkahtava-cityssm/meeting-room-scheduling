"use client";
import Link from "next/link";
import {
  Columns,
  Grid3x3,
  List,
  Plus,
  Grid2x2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  LucideFilter,
  LucideSearch,
  LucideMenuSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomSelect } from "@/app/features/rooms/room-select";

import type { TCalendarView, TStatusKey } from "@/lib/types";
import { navigateDate, navigateURL } from "@/lib/helpers";
import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";
import { useRouter } from "next/navigation";

import { DateNavigator, NavigationButtons } from "./calendar-all-header-date-navigator";
import { TodayButton } from "./calendar-all-header-today-button";
import { CalendarPermissions } from "../permissions/calendar.permissions";

import EventDrawerRefactor from "../../event-drawer-refactor/event-drawer-root";
import { useSharedEventDrawer } from "../../event-drawer-refactor/shared-event-drawer-context";

import { StatusMultiSelect } from "../../status/status-multiselect";
import { RoomMultiSelect } from "../../rooms/room-multiselect";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DateControls } from "../view-public/public-date-control";
import { useState } from "react";
import { CalendarDayPopover } from "@/components/calendar-day-popover/calendar-day-popover";
import { formatDate } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function CalendarHeader({
  view,
  selectedDate,
  userId,
  permissions,
}: {
  view: Exclude<TCalendarView, "all" | "public">;
  selectedDate: Date;
  userId?: string;
  permissions: Record<Exclude<TCalendarView, "all" | "public">, boolean>;
}) {
  const { day, week, month, year, agenda } = permissions;

  const { openEventDrawer } = useSharedEventDrawer();
  const { can, isVerifying } = CalendarPermissions.usePermissions();
  const { setSelectedRoomId, selectedRoomId, setSelectedStatusKeys, selectedStatusKeys } = usePrivateCalendar();
  const { push } = useRouter();

  const handleNavigatePrevious = () => {
    const previousDate = navigateDate(selectedDate, view, "previous");

    push(navigateURL(previousDate, view));
  };

  const handleNavigateNext = () => {
    const nextDate = navigateDate(selectedDate, view, "next");

    push(navigateURL(nextDate, view));
  };

  const handleNavigateRoomChange = (value: string) => {
    setSelectedRoomId(value);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:border-b p-4 min-w-90 lg:flex-row lg:items-end lg:justify-between shrink-0">
        <MobileHeader permissions={permissions} view={view} selectedDate={selectedDate} className="flex sm:hidden" />
        <div className="hidden sm:flex items-center gap-3">
          <TodayButton view={view} />

          <DateNavigator
            view={view}
            selectedDate={selectedDate}
            onPreviousClick={handleNavigatePrevious}
            onNextClick={handleNavigateNext}
          />
        </div>

        <div className="hidden items-center gap-1.5  sm:flex sm:flex-row lg:justify-between lg:ml-auto ">
          <div className="w-full sm:w-1/2 flex flex-col flex-1 gap-1">
            <Label>Status</Label>
            <StatusMultiSelect
              selectedStatusKeys={selectedStatusKeys}
              onChange={(values) => setSelectedStatusKeys(values as TStatusKey[])}
              excludeStatusKeys={[]}
              isDisabled={false}
              className="min-w-60 lg:w-60"
            />
          </div>
          <div className="w-full sm:w-1/2 flex flex-col flex-1 gap-1">
            <Label>Rooms</Label>
            <RoomMultiSelect
              includeAllOption={false}
              selectedRoomIds={[selectedRoomId]}
              onChange={(values) => handleNavigateRoomChange(values[0])}
              excludeRoomIds={[]}
              isDisabled={false}
              className="min-w-60 lg:w-60"
            />
          </div>
        </div>

        <div className="hidden sm:flex sm:gap-4 sm:flex-row sm:justify-between ">
          <div className="flex flex-col w-full items-center gap-1.5">
            <div className="inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
              <Button
                asChild={day}
                aria-label="View by day"
                size="icon"
                variant={view === "day" ? "default" : "outline"}
                className="rounded-r-none [&_svg]:size-5"
                disabled={!day}
              >
                <Link href={navigateURL(selectedDate, "day")}>
                  <List strokeWidth={1.8} />
                </Link>
              </Button>

              <Button
                asChild={week}
                aria-label="View by week"
                size="icon"
                variant={view === "week" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
                disabled={!week}
              >
                <Link href={navigateURL(selectedDate, "week")}>
                  <Columns strokeWidth={1.8} />
                </Link>
              </Button>

              <Button
                asChild={month}
                aria-label="View by month"
                size="icon"
                variant={view === "month" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
                disabled={!month}
              >
                <Link href={navigateURL(selectedDate, "month")}>
                  <Grid2x2 strokeWidth={1.8} />
                </Link>
              </Button>

              <Button
                asChild={year}
                aria-label="View by year"
                size="icon"
                variant={view === "year" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
                disabled={!year}
              >
                <Link href={navigateURL(selectedDate, "year")}>
                  <Grid3x3 strokeWidth={1.8} />
                </Link>
              </Button>

              <Button
                asChild={agenda}
                aria-label="View by agenda"
                size="icon"
                variant={view === "agenda" ? "default" : "outline"}
                className="-ml-px rounded-l-none [&_svg]:size-5"
                disabled={!agenda}
              >
                <Link href={navigateURL(selectedDate, "agenda")}>
                  <CalendarRange strokeWidth={1.8} />
                </Link>
              </Button>
            </div>
          </div>

          {!isVerifying && can("CreateEvent") && (
            <Button
              className="w-full sm:w-auto"
              onClick={() => openEventDrawer({ userId: userId, creationDate: new Date() })}
            >
              <Plus />
              Add Event
            </Button>
          )}
        </div>
      </div>
      <div className="flex border-b sm:hidden items-center gap-3">
        <MobileDateControls
          selectedDate={selectedDate}
          view={view}
          onPreviousClick={handleNavigatePrevious}
          onNextClick={handleNavigateNext}
        ></MobileDateControls>
      </div>
    </>
  );
}

const MobileHeader = ({
  selectedDate,
  permissions,
  view,
  className,
}: {
  permissions: Record<Exclude<TCalendarView, "all" | "public">, boolean>;
  selectedDate: Date;
  view: Exclude<TCalendarView, "all" | "public">;
  className?: string;
}) => {
  const { day, week, month, year, agenda } = permissions;
  return (
    <div className={cn("flex items-center gap-2 justify-between", className)}>
      <span className="text-lg font-semibold w-35">
        {formatDate(selectedDate, "MMMM")} {selectedDate.getFullYear()}
      </span>
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="px-2">
              <LucideMenuSquare className="size-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <RadioGroup defaultValue={view} value={view} className="gap-4">
              <ConditionalLink
                href={navigateURL(selectedDate, "day")}
                isDisabled={!day}
                id={"day"}
                value={"day"}
                label={"Day"}
                icon={<List className="size-4" />}
              ></ConditionalLink>
              <ConditionalLink
                href={navigateURL(selectedDate, "week")}
                isDisabled={!week}
                id={"week"}
                value={"week"}
                label={"Week"}
                icon={<Columns className="size-4" />}
              ></ConditionalLink>
              <ConditionalLink
                href={navigateURL(selectedDate, "month")}
                isDisabled={!month}
                id={"month"}
                value={"month"}
                label={"Month"}
                icon={<Grid2x2 className="size-4" />}
              ></ConditionalLink>
              <ConditionalLink
                href={navigateURL(selectedDate, "year")}
                isDisabled={!year}
                id={"year"}
                value={"year"}
                label={"Year"}
                icon={<Grid3x3 className="size-4" />}
              ></ConditionalLink>

              <ConditionalLink
                href={navigateURL(selectedDate, "agenda")}
                isDisabled={!agenda}
                id={"agenda"}
                value={"agenda"}
                label={"Agenda"}
                icon={<CalendarRange className="size-4" />}
              ></ConditionalLink>
            </RadioGroup>
          </PopoverContent>
        </Popover>

        <Button size="sm" variant="ghost" className="px-2">
          <LucideFilter className="size-6" />
        </Button>
      </div>
    </div>
  );
};

const ConditionalLink = ({
  isDisabled,
  href,
  id,
  value,
  label,
  icon,
}: {
  isDisabled: boolean;
  href: string;

  id: string;
  value: string;
  label: string;
  icon: React.ReactNode;
}) => {
  if (isDisabled) {
    return (
      <div>
        <div className="flex justify-between gap-3 opacity-50">
          <div className="flex gap-3">
            {icon}
            <Label htmlFor={id}>{label}</Label>
          </div>
          <RadioGroupItem value={value} id={id} disabled={isDisabled} />
        </div>
      </div>
    );
  }
  return (
    <Link href={href} className="cursor-pointer">
      <div className="flex justify-between gap-3 cursor-pointer">
        <div className="flex gap-3 cursor-pointer">
          {icon}
          <Label htmlFor={id} className="cursor-pointer">
            {label}
          </Label>
        </div>
        <RadioGroupItem value={value} id={id} disabled={isDisabled} className="cursor-pointer" />
      </div>
    </Link>
  );
};

const MobileDateControls = ({
  view,
  selectedDate,
  onPreviousClick,
  onNextClick,
}: {
  view: TCalendarView;
  selectedDate: Date;
  onPreviousClick: () => void;
  onNextClick: () => void;
}) => {
  const { push } = useRouter();

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center w-full py-2 gap-2 mx-4">
      <Button asChild size="lg" variant="ghost" className="px-2">
        <Link
          href={navigateURL(navigateDate(selectedDate, view, "previous"), view)}
          onClick={onPreviousClick}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </Button>

      <div className="flex justify-center">
        <CalendarDayPopover
          id="TodayDate"
          disabled={false}
          value={selectedDate}
          onSelect={(selectedDate) => {
            if (!selectedDate) return;
            push(navigateURL(selectedDate, "public"));
          }}
          placeholder={formatDate(selectedDate, "MMMM do, yyyy")}
          data-invalid={false}
        >
          <Button size="lg" variant="ghost" className="text-base font-semibold px-2">
            <span className="whitespace-nowrap">{formatDate(selectedDate, "PPP")}</span>
          </Button>
        </CalendarDayPopover>
      </div>

      <Button asChild size="lg" variant="ghost" className="px-2">
        <Link
          href={navigateURL(navigateDate(selectedDate, view, "next"), view)}
          onClick={onNextClick}
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
};
