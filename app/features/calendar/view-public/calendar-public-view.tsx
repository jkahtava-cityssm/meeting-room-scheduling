"use client";

import { parse, endOfDay, startOfDay } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { IEvent } from "@/lib/schemas/calendar";
import { TIME_BLOCK_SIZE, TVisibleHours } from "@/lib/types";
import { PUBLIC_IEVENT, usePublicEventsQuery, usePublicRoomsQuery } from "@/lib/services/public";
import { useSearchParams } from "next/navigation";

import { DateControls } from "./public-header";
import { RoomCategoryLayout } from "./public-categories";

import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";

import { CalendarDayViewSkeleton } from "../view-day/skeleton-calendar-day-view";

import { IBlock } from "../calendar-day-grid/calendar-day-grid-webworker";
import { CalendarPermissions } from "../permissions/calendar.permissions";
import { CalendarScrollContainerPublic } from "../components/calendar-scroll-container";
import { CalendarScrollColumnPublic } from "../components/calendar-scroll-column";
import { CalendarWeekViewSkeleton } from "../view-week/skeleton-calendar-week-view";
import { useRoomFiltering } from "./use-room-filtering";

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

export function CalendarPublicView({ sideBarOpen = false }: { sideBarOpen?: boolean }) {
  //console.log(sideBarOpen);
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("selectedDate");

  const dateValue = useMemo(() => {
    return getViewDate(dateParam);
  }, [dateParam]);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);
  const [dayViews, setDayViews] = useState<IDayView>();
  const [data, setData] = useState([]);

  const { interval, visibleRooms, visibleHours, defaultHours, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const [hours, setHours] = useState<number[] | undefined>(defaultHours);
  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfDay(dateValue);
  const endDate: Date = endOfDay(dateValue);

  const { data: events } = usePublicEventsQuery(startDate, endDate);

  const { data: rooms } = usePublicRoomsQuery();

  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

  const { checkedRooms, debouncedRooms, toggleRoom, filterByProjector, selectAll } = useRoomFiltering(rooms);

  const filteredRooms = useMemo(() => {
    return rooms?.filter((room) => debouncedRooms.includes(room.roomId));
  }, [rooms, debouncedRooms]);

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    setLoading(true);
  }, [dateValue]);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications

    if (workerRef.current) {
      return;
    }

    const newWorker = new Worker(new URL("../webworkers/calendar-public-webworker.ts", import.meta.url));

    newWorker.onmessage = (result) => {
      setData(result.data);
      setDayViews(result.data.dayView);
      setHours(result.data.hours);
      //setTotalEvents(result.totalEvents);
      setIsHeaderLoading(false);
      setLoading(false);
    };

    workerRef.current = newWorker;

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [dateValue, setIsHeaderLoading, setTotalEvents]);

  useEffect(() => {
    if (!events || !rooms) {
      return;
    }

    if (workerRef.current) {
      const data: IPublicProcessData = {
        events: events,
        visibleHours: visibleHours ? visibleHours : { from: 1, to: 24 },
        selectedDate: dateValue,
        roomIdList: rooms.map((room) => room.roomId.toString()),
        multiDayEventsAtTop: true,
        pixelHeight: TIME_BLOCK_SIZE,
      };
      //setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, dateValue, isRefreshed, rooms, setIsHeaderLoading, visibleHours]);

  const memoizedHours = useMemo(() => hours, [hours]);

  const lastRoomId = filteredRooms?.length ? filteredRooms[filteredRooms.length - 1].roomId : undefined;
  const isMounting = !dayViews || !hours || !filteredRooms;
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 overflow-auto ">
      {/* LEFT CONTAINER */}
      <div className="w-full flex flex-col gap-2 p-4 sm:p-0 lg:w-72 ">
        {/* HEADER: Label & Button stack when tight */}
        <div className="flex flex-wrap items-center justify-between py-2">
          <label className="font-bold">Filter</label>
          <ButtonGroup>
            <Button size="sm" className="text-xs" onClick={filterByProjector}>
              <FilterIcon></FilterIcon> Rooms with Projectors
            </Button>
            <ButtonGroupSeparator />
            <Button size="sm" className="text-xs " onClick={selectAll}>
              Reset
            </Button>
          </ButtonGroup>
        </div>
        {/* BODY: Checkboxes */}
        <div className="w-full shrink-0 border rounded-lg p-4 lg:w-72 ">
          {!isMounting && (
            <RoomCategoryLayout
              checkedRooms={checkedRooms}
              onToggleRoom={toggleRoom}
              rooms={rooms || []}
            ></RoomCategoryLayout>
          )}
        </div>
      </div>

      {/* RIGHT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 gap-2 min-h-0 ">
        {/* HEADER: Date Nav stacks middle item on top if narrow */}

        <DateControls selectedDate={dateValue}></DateControls>
        {/* MAIN PANEL: Grows to take space */}
        <div className="flex border rounded-lg sm:p-4 min-h-125">
          <CalendarScrollContainerPublic
            isLoading={isLoading}
            hours={hours || []}
            isMounting={isMounting || filteredRooms.length === 0}
            skeleton={<CalendarWeekViewSkeleton />}
          >
            {filteredRooms?.map((room) => {
              return (
                <CalendarScrollColumnPublic
                  key={room.roomId}
                  loadingBlocks={isLoading}
                  title={room.name}
                  interval={interval}
                  roomId={room.roomId}
                  userId={undefined}
                  hours={hours || []}
                  eventBlocks={(dayViews?.eventBlocks.get(String(room.roomId)) as unknown as IBlock[]) || []}
                  isLastColumn={room.roomId === lastRoomId}
                  currentDate={dateValue}
                />
              );
            })}
          </CalendarScrollContainerPublic>
        </div>
      </div>
    </div>
  );
}
