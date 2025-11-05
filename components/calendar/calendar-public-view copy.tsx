"use client";

import { startOfWeek, endOfWeek, parse, format, addYears, formatDate, endOfDay, startOfDay } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CalendarWeekViewSkeleton } from "./skeleton-calendar-week-view";
import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";
import { PUBLIC_IEVENT, usePublicEventsQuery, usePublicRoomsQuery } from "@/services/public";
import { useSearchParams } from "next/navigation";
import { RoomCategoryLayout } from "./calendar-public-view-room-list";
import { DateControlSkeleton, FilteredRoomGrid } from "./calendar-public-view-room-grid";
import { CalendarPublicViewRoomGridSkeleton } from "./skeleton-calendar-public-view-room-grid";
import { RoomCategoryLayoutSkeleton } from "./skeleton-calendar-public-view-room-list";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Checkbox } from "@radix-ui/react-checkbox";
import { FilterIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export interface IPublicProcessData {
  events: PUBLIC_IEVENT[];
  selectedDate: Date;
  roomIdList: string[];
  pixelHeight: number;
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
}

export interface IPublicResponseData {
  totalEvents: number;
  dayView: IDayView;
  hours: number[];
  //weekViews: WeekView[];
}

export type IEventList = Map<string, IEventBlock[]>;

export interface IDayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  eventBlocks: IEventList;
}

export interface IEventBlock {
  key: string;
  groupIndex: number;
  eventIndex: number;
  eventStyle: { top: string; width: string; left: string };
  eventHeight: number;
  event: IEvent;
}

function getViewDate(dateParam: string | null) {
  return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, "yyyy-MM-dd", new Date());
}

function removeTimeFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const rooms: {
  roomId: number;
  name: string;
  color: string;
  roomCategory: {
    name: string;
    roomCategoryId: number;
  };
  roomProperty: {
    value: string;
    name: string;
  }[];
}[] = [
  {
    roomId: 1,
    name: "Ocean View Suite",
    color: "#1E90FF",
    roomCategory: {
      name: "Suite",
      roomCategoryId: 101,
    },
    roomProperty: [
      { name: "Bed Type", value: "King" },
      { name: "Balcony", value: "Yes" },
      { name: "Floor", value: "5" },
    ],
  },
  {
    roomId: 2,
    name: "Garden Deluxe",
    color: "#228B22",
    roomCategory: {
      name: "Deluxe",
      roomCategoryId: 102,
    },
    roomProperty: [
      { name: "Bed Type", value: "Queen" },
      { name: "View", value: "Garden" },
      { name: "Floor", value: "2" },
    ],
  },
  {
    roomId: 3,
    name: "Penthouse Loft",
    color: "#8B008B",
    roomCategory: {
      name: "Penthouse",
      roomCategoryId: 103,
    },
    roomProperty: [
      { name: "Bed Type", value: "California King" },
      { name: "Private Pool", value: "Yes" },
      { name: "Floor", value: "10" },
    ],
  },
  {
    roomId: 4,
    name: "Standard Twin",
    color: "#A9A9A9",
    roomCategory: {
      name: "Standard",
      roomCategoryId: 104,
    },
    roomProperty: [
      { name: "Bed Type", value: "Twin" },
      { name: "Smoking", value: "No" },
      { name: "Floor", value: "1" },
    ],
  },
  {
    roomId: 5,
    name: "Standard Twin",
    color: "#A9A9A9",
    roomCategory: {
      name: "Standard",
      roomCategoryId: 104,
    },
    roomProperty: [
      { name: "Bed Type", value: "Twin" },
      { name: "Smoking", value: "No" },
      { name: "Floor", value: "1" },
    ],
  },
];

export function CalendarPublicView({ sideBarOpen = false }: { sideBarOpen?: boolean }) {
  const isOpen = sideBarOpen;
  return (
    <>
      <div className={`flex flex-col sm:flex-row gap-2  `}>
        {/* Filter Panel */}
        <RoomCategoryLayout rooms={rooms} key={"A"}></RoomCategoryLayout>
        <FilteredRoomGrid
          isLoading={true}
          filteredRooms={undefined}
          hours={undefined}
          eventBlocks={undefined}
          selectedDate={new Date()}
          isSidebarOpen={isOpen}
        />
      </div>
    </>
  );
}
