/// <reference lib="webworker" />

import { IEvent, IEventSingleRoom } from '@/lib/schemas';
import { TColors, TStatusKey, TVisibleHours } from '@/lib/types';
import {
  calculateMultiDayEventPositions,
  calculateViewBoundaries,
  filterEventsByRoom,
  filterEventsByStatus,
  generateMultiDayEventsInPeriod,
  generateRecurringEventsInPeriod,
  getDateRange,
  processMultiRoomEvents,
  processRequestEvents,
  setMultiDayEventBoundaries,
  transformToGrid,
  transformToRoomBlocks,
  transformToWeekBlocks,
  transformToYearly,
} from './generic-webworker-utilities';

// --- Base Interfaces ---
export type GroupingType = 'date' | 'roomId' | 'none';
export type CalendarAction = 'AGENDA' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'REQUESTS';
export type ISODateString = string & { __brand: 'ISODateString' };

export interface IRequestSection {
  sectionId: string;
  sectionTitle: string;
  sectionGroups: IRequestGroup[];
}

export interface IRequestGroup {
  groupId: string;
  groupName: string;
  groupColor: TColors;
  groupEvents: IEventSingleRoom[];
}

export interface IEventBlock {
  key: string;
  groupIndex: number;
  eventIndex: number;
  eventStyle: { top: string; width: string; left: string };
  eventHeight: number;
  event: IEventSingleRoom;
  roomId?: number;
}

export interface IEventView {
  index: number;
  position: 'none' | 'middle' | 'first' | 'last' | 'single';
  event: IEventSingleRoom | undefined;
}

export interface IMonthDayView {
  day: number;
  dayDate: ISODateString;
  isToday: boolean;
  isSunday: boolean;
  isCurrentMonth: boolean;
  totalEvents: number;
  eventRecords: IEventView[];
}

export interface IMonthWeekView {
  week: number;
  maxDailyEvents: number;
  dayViews: IMonthDayView[];
}

export interface IYearMonthView {
  month: number;
  monthDate: ISODateString;
  monthName: string;
  days: IYearDayView[];
}

export interface IYearDayView {
  day: number;
  dayDate: ISODateString;
  isBlank: boolean;
  isToday: boolean;
  dayEvents: IEventSingleRoom[];
}

export type TProcessedBlockData = { roomBlocks: Map<string, IEventBlock[]>; hours: number[] };
export type TProcessedWeekData = { dayBlocks: Map<string, Map<string, IEventBlock[]>>; hours: number[] };

export interface IDayRoomBlock {
  roomBlocks: Record<string, IEventBlock[]>;
  hours: number[];
}

export interface IWeekData {
  dayBlocks: Record<string, IEventBlock[]>;
  hours: number[];
}

export type CalendarDataMap = {
  AGENDA: { sortedEvents: IEventSingleRoom[] };
  DAY: IDayRoomBlock;
  WEEK: IWeekData;
  MONTH: { dayViews: IMonthDayView[]; weekViews: IMonthWeekView[] };
  YEAR: { monthViews: IYearMonthView[] };
  REQUESTS: { requestSections: IRequestSection[] };
};

export type ProcessedDataMap = {
  AGENDA: { sortedEvents: IEventSingleRoom[] };
  DAY: IDayRoomBlock; // Was TProcessedBlockData (Map)
  WEEK: IWeekData; // Was TProcessedWeekData (Map)
  MONTH: { dayViews: IMonthDayView[]; weekViews: IMonthWeekView[] };
  YEAR: { monthViews: IYearMonthView[] };
  REQUESTS: { requestSections: IRequestSection[] };
};

export interface ICalendarProcessData {
  events: IEvent[];
  selectedDate: ISODateString;
  selectedRoomId?: string | string[];
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
  action: CalendarAction;
  requestId: number;
  userId?: string;
  statusKeys?: TStatusKey[];
}

export interface IUnifiedResponse<A extends CalendarAction = CalendarAction> {
  action: A;
  data: CalendarDataMap[A];
  totalEvents: number;
  requestId: number;
  error?: string;
}

self.onmessage = async (event: MessageEvent<ICalendarProcessData>) => {
  if (!event.data) return;

  const requestId: number = event.data.requestId;

  try {
    let payload: ICalendarProcessData | null = event.data;
    const { action, events, selectedDate, visibleHours, statusKeys } = payload;

    const currentDate = new Date(selectedDate);

    // Get DateRange Based on View
    const range = getDateRange(action, currentDate);

    const [multiDayEvents, recurringEvents] = await Promise.all([
      calculateMultiDayEventPositions(events, range.startDate, range.endDate),
      generateRecurringEventsInPeriod(events, range.startDate, range.endDate),
    ]);
    const viewBounds = calculateViewBoundaries(
      visibleHours,
      [...multiDayEvents, ...recurringEvents] as IEventSingleRoom[],
      range.startDate,
      range.endDate,
    );

    const boundedEvents = setMultiDayEventBoundaries([...multiDayEvents, ...recurringEvents], viewBounds.from, viewBounds.to);

    const splitMultiRoomEvents = action !== 'AGENDA' && action !== 'REQUESTS';
    const multiRoomEvents = processMultiRoomEvents(boundedEvents, splitMultiRoomEvents);

    const filtered = filterEventsByRoom(multiRoomEvents, payload.selectedRoomId || '-1');
    const filteredByStatus = filterEventsByStatus(filtered, statusKeys ?? []);

    const sortedEvents = filteredByStatus.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    // 2. Generic Transformation Logic
    let resultData: CalendarDataMap[CalendarAction] | null = null;

    switch (action) {
      case 'AGENDA':
        resultData = { sortedEvents };
        break;

      case 'DAY':
        // These all share the "Block" logic with different date ranges
        const blockResult = transformToRoomBlocks(sortedEvents, viewBounds.from, viewBounds.to);
        resultData = {
          roomBlocks: blockResult.roomBlocks,
          hours: blockResult.hours,
        };
        break;
      case 'WEEK':
        const weekResult = transformToWeekBlocks(sortedEvents, viewBounds.from, viewBounds.to, range.startDate, range.endDate);

        resultData = {
          dayBlocks: weekResult.dayBlocks, // This will be a Record for DAY/PUBLIC, and an Array for WEEK
          hours: weekResult.hours,
        };
        break;
      case 'MONTH':
        const gridResult = transformToGrid(sortedEvents, currentDate, payload.multiDayEventsAtTop);
        resultData = { dayViews: gridResult.dayViews, weekViews: gridResult.weekViews };
        break;

      case 'YEAR':
        const yearResult = transformToYearly(sortedEvents, currentDate);
        resultData = { monthViews: yearResult.monthViews };
        break;
      case 'REQUESTS':
        const requestResult = processRequestEvents(sortedEvents);
        resultData = { requestSections: requestResult };
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    if (!resultData) throw new Error('Transformation failed to produce data');

    const response: IUnifiedResponse = {
      totalEvents: sortedEvents.length,
      action,
      data: resultData,
      requestId,
    };

    const bytes = new TextEncoder().encode(JSON.stringify(response));
    self.postMessage(bytes.buffer, [bytes.buffer]);

    resultData = null;
    payload = null;
  } catch (error) {
    const errorPayload = {
      error: error instanceof Error ? error.message : 'Unknown Worker Error',
      requestId: requestId ? requestId : -1,
    };

    const bytes = new TextEncoder().encode(JSON.stringify(errorPayload));
    const errorBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    self.postMessage(errorBuffer, [errorBuffer]);
  }
};
