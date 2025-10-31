"use client";

import { startOfWeek, endOfWeek, parse, format, addYears, formatDate } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CalendarWeekViewSkeleton } from "./skeleton-calendar-week-view";
import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";
import { PUBLIC_IEVENT, usePublicEventsQuery, usePublicRoomsQuery } from "@/services/public";
import { useSearchParams } from "next/navigation";
import { RoomCategoryLayout } from "./calendar-public-view-room-list";
import { FilteredRoomGrid } from "./calendar-public-view-room-grid";

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

export function CalendarPublicView() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("selectedDate");

  const dateValue = useMemo(() => {
    return getViewDate(dateParam);
  }, [dateParam]);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);
  const [dayViews, setDayViews] = useState<IDayView>();
  const [data, setData] = useState([]);
  const [hours, setHours] = useState<number[]>([]);

  const { workingHours, visibleHours, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfWeek(dateValue);
  const endDate: Date = endOfWeek(dateValue);

  const { data: events } = usePublicEventsQuery(startDate, endDate);

  const { data: rooms } = usePublicRoomsQuery();

  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

  const filteredRooms = useMemo(() => {
    return selectedRoomIds.length > 0 ? rooms?.filter((room) => selectedRoomIds.includes(room.roomId)) : [];
  }, [rooms, selectedRoomIds]);

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

    const newWorker = new Worker(new URL("./webworkers/calendar-public-webworker.ts", import.meta.url));

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
        visibleHours: visibleHours,
        selectedDate: dateValue,
        roomIdList: rooms.map((room) => room.roomId.toString()),
        multiDayEventsAtTop: true,
        pixelHeight: 96,
      };
      //setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, dateValue, isRefreshed, rooms, setIsHeaderLoading, visibleHours]);

  const handleCheckedRoomsChange = useCallback((checkedIds: number[]) => {
    setSelectedRoomIds(checkedIds);
  }, []);

  const memoizedHours = useMemo(() => hours, [hours]);

  if (isLoading || !filteredRooms || !events) {
    return <CalendarWeekViewSkeleton />;
  }

  if (filteredRooms || events) {
    <div>...</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 ">
        <RoomCategoryLayout rooms={rooms || []} onCheckedRoomsChange={handleCheckedRoomsChange} />

        {<FilteredRoomGrid filteredRooms={filteredRooms} hours={memoizedHours} eventBlocks={dayViews?.eventBlocks} />}
      </div>
    </>
  );
}
