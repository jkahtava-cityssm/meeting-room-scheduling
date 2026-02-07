import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";
import {
  calculateViewBoundaries,
  filterEventsByRoom,
  generateMultiDayEventsInPeriod,
  generateRecurringEventsInPeriod,
  getDateRange,
  transformToBlocks,
  transformToGrid,
  transformToYearly,
} from "./generic-webworker-utilities";

// --- Base Interfaces ---
export type GroupingType = "date" | "roomId" | "none";
export type CalendarAction = "AGENDA" | "DAY" | "WEEK" | "MONTH" | "YEAR" | "PUBLIC";

export interface IEventBlock {
  key: string;
  groupIndex: number;
  eventIndex: number;
  eventStyle: { top: string; width: string; left: string };
  eventHeight: number;
  event: IEvent;
  roomId?: number;
}

export interface IEventView {
  index: number;
  position: "none" | "middle" | "first" | "last";
  event: IEvent | undefined;
}

export interface IMonthDayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  isSunday: boolean;
  isCurrentMonth: boolean;
  eventRecords: IEventView[];
}

export interface IYearMonthView {
  month: number;
  monthDate: Date;
  monthName: string;
  days: {
    day: number;
    dayDate: Date;
    isBlank: boolean;
    isToday: boolean;
    dayEvents: IEvent[];
  }[];
}

export type TRawBlockData = { roomBlocks: Record<string, IEventBlock[]>; hours: number[] };
export type TProcessedBlockData = { roomBlocks: Map<string, IEventBlock[]>; hours: number[] };

export type CalendarDataMap = {
  AGENDA: { sortedEvents: IEvent[] };
  DAY: TRawBlockData;
  WEEK: TRawBlockData;
  PUBLIC: TRawBlockData;
  MONTH: { dayViews: IMonthDayView[] };
  YEAR: { monthsViews: IYearMonthView[] };
};

export type ProcessedDataMap = {
  [K in keyof CalendarDataMap]: K extends "DAY" | "WEEK" | "PUBLIC" ? TProcessedBlockData : CalendarDataMap[K];
};

export interface ICalendarProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId?: string | string[];
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
  action: CalendarAction;
  requestId?: number;
}

export interface IUnifiedResponse<A extends CalendarAction = CalendarAction> {
  action: A;
  data: CalendarDataMap[A];
  totalEvents: number;
  groupingType: GroupingType;
  requestId?: number;
  error?: string;
}

self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  if (!event.data) return;

  let requestId: number | undefined;

  try {
    // 1. Decode the incoming Buffer
    const decoder = new TextDecoder();
    const json = decoder.decode(event.data);
    const payload: ICalendarProcessData = JSON.parse(json);

    requestId = payload.requestId;

    const { action, events, selectedDate, visibleHours } = payload;

    // Get DateRange Based on View
    const range = getDateRange(action, selectedDate);

    const viewBounds = calculateViewBoundaries(visibleHours, events as IEvent[]);

    const [multiDayEvents, recurringEvents] = await Promise.all([
      generateMultiDayEventsInPeriod(
        events as IEvent[],
        range.startDate,
        range.endDate,
        viewBounds.from,
        viewBounds.to,
      ),
      generateRecurringEventsInPeriod(events as IEvent[], range.startDate, range.endDate),
    ]);

    const combinedEvents: IEvent[] = [...multiDayEvents, ...recurringEvents];
    const filtered = filterEventsByRoom(combinedEvents, payload.selectedRoomId || "-1");
    const sortedEvents = filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    // 2. Generic Transformation Logic
    let resultData: CalendarDataMap[CalendarAction];
    let groupingType: GroupingType = "none";

    switch (action) {
      case "AGENDA":
        resultData = { sortedEvents };
        break;

      case "DAY":
      case "WEEK":
      case "PUBLIC":
        // These all share the "Block" logic with different date ranges
        const blockResult = transformToBlocks(sortedEvents, viewBounds.from, viewBounds.to, action);
        resultData = {
          roomBlocks: blockResult.roomBlocks,
          hours: blockResult.hours,
        };
        groupingType = blockResult.groupingType;
        break;

      case "MONTH":
        const gridResult = transformToGrid(sortedEvents, payload.selectedDate, payload.multiDayEventsAtTop);
        resultData = { dayViews: gridResult.dayViews };
        break;

      case "YEAR":
        const yearResult = transformToYearly(sortedEvents, selectedDate);
        resultData = { monthsViews: yearResult.monthsViews };
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    if (!resultData) throw new Error("Transformation failed to produce data");

    const response: IUnifiedResponse = {
      totalEvents: sortedEvents.length,
      action,
      data: resultData,
      requestId,
      groupingType,
    };

    const encoder = new TextEncoder();
    const resultBuffer = encoder.encode(JSON.stringify(response)).buffer;

    // The second argument [resultBuffer] tells the browser to MOVE the memory, not copy it.
    self.postMessage(resultBuffer, [resultBuffer]);
  } catch (error) {
    const errorPayload = {
      error: error instanceof Error ? error.message : "Unknown Worker Error",
      requestId,
    };

    const encoder = new TextEncoder();
    const errorBuffer = encoder.encode(JSON.stringify(errorPayload)).buffer;
    self.postMessage(errorBuffer, [errorBuffer]);
  }
};
