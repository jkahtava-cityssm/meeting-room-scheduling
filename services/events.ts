//"use server";
//import { IEvent } from "@/calendar/interfaces";
import { IRecurrence, IRoom } from "@/components/calendar/lib/interfaces";
import { prisma } from "@/prisma";

import { Event, Room } from "@prisma/client";
import {
  addDays,
  differenceInDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isWithinInterval,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { revalidateTag } from "next/cache";
import { revalidateEventCache } from "./actions";

import useSWR from "swr";
import { date, z } from "zod";
import { getRecurringEvents } from "@/components/calendar/lib/helpers";
import { rrulestr } from "rrule";
import { TVisibleHours } from "@/components/calendar/lib/types";

export const SRoom: z.ZodType<IRoom> = z.object({
  roomId: z.number(),
  color: z.string().min(1, "Colour is required"),
  name: z.string().min(1, "Name is required"),
  createdAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  updatedAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  icon: z.string().nullable(),
});

export const SRecurrence: z.ZodType<IRecurrence> = z.object({
  recurrenceId: z.number(),
  recurrenceCancellationId: z.number().nullable(),
  recurrenceExceptionId: z.number().nullable(),
  rule: z.string().min(1, "Rule is required"),
  startDate: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  endDate: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  createdAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  updatedAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
});

export const SEvent: z.ZodType<IEvent> = z.object({
  eventId: z.number(),
  roomId: z.number(),
  recurrenceId: z.number().nullable(),
  startDate: z.coerce.date(), //z.string().transform((value) => new Date(value)), //.date({ required_error: "Start date is required" }),
  endDate: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  parentEventId: z.number().nullable().optional(),
  room: SRoom,
  recurrence: SRecurrence.nullish(),
  createdAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  updatedAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
});

export interface IEvent extends Event {
  eventId: number;
  roomId: number;
  recurrenceId: number | null;
  startDate: Date;
  endDate: Date;
  title: string;
  description: string;
  //parentEventId: number | null;
  //eventIsSplit: boolean;
  room: IRoom;
  recurrence?: IRecurrence | null;
  createdAt: Date;
  updatedAt: Date;
}

type BEvent = z.infer<typeof SEvent>;

const SEvents = z.array(SEvent);

export function useAllDailyEvents(selectedDate: Date, visibleHours: TVisibleHours) {
  const StartOfDay = startOfDay(selectedDate);
  const EndOfDay = endOfDay(selectedDate);

  return useAllEvents(StartOfDay, EndOfDay, visibleHours);
}

export function useAllWeeklyEvents(selectedDate: Date, visibleHours: TVisibleHours) {
  const StartOfWeek = startOfWeek(selectedDate);
  const EndOfWeek = endOfWeek(selectedDate);

  return useAllEvents(StartOfWeek, EndOfWeek, visibleHours);
}

export function useAllMonthlyEvents(selectedDate: Date, visibleHours: TVisibleHours) {
  const StartOfMonth = startOfMonth(selectedDate);
  const EndOfMonth = endOfMonth(selectedDate);

  return useAllEvents(StartOfMonth, EndOfMonth, visibleHours);
}

export function useAllYearlyEvents(selectedDate: Date, visibleHours: TVisibleHours) {
  const StartOfYear = startOfYear(selectedDate);
  const EndOfYear = endOfYear(selectedDate);

  return useAllEvents(StartOfYear, EndOfYear, visibleHours);
}

function useAllEvents(
  startDate: Date,
  endDate: Date,
  visibleHours: TVisibleHours
): { events: IEvent[] | undefined; isLoading: boolean; isError: any } {
  const {
    events: standardEvents,
    isLoading: standardIsLoading,
    isError: standardIsError,
  } = useEvents(startDate, endDate);
  const {
    events: recurringEvents,
    isLoading: recurringIsLoading,
    isError: recurringIsError,
  } = useRecurrence(startDate, endDate);

  return {
    events:
      standardEvents && recurringEvents
        ? [
            ...generateMultiDayEventsInPeriod(standardEvents, startDate, endDate, visibleHours),
            ...generateRecurringEventsInPeriod(recurringEvents, startDate, endDate),
          ]
        : undefined,
    isLoading: standardIsLoading || recurringIsLoading ? true : false,
    isError: [standardIsError, recurringIsError],
  };
}

function generateRecurringEventsInPeriod(events: IEvent[], periodStart: Date, periodEnd: Date) {
  const eventList: IEvent[] = [];

  events.forEach((element) => {
    if (element.recurrenceId == null) {
      return;
    }

    const currentRule = element.recurrence?.rule as string;

    const rrule = rrulestr(currentRule);
    const recurrenceArray = rrule.between(setPartsToUTCDate(periodStart), setPartsToUTCDate(periodEnd));

    for (let index = 0; index < recurrenceArray.length; index++) {
      const newEvent = { ...element };
      const recurringDate = setUTCPartsToDate(recurrenceArray[index]);
      newEvent.title = "Series - " + newEvent.title;
      newEvent.startDate = set(newEvent.startDate, {
        year: recurringDate.getFullYear(),
        month: recurringDate.getMonth(),
        date: recurringDate.getDate(),
      });
      newEvent.endDate = set(newEvent.endDate, {
        year: recurringDate.getFullYear(),
        month: recurringDate.getMonth(),
        date: recurringDate.getDate(),
      });

      eventList.push(newEvent);
    }
  });
  return eventList;
}

function generateMultiDayEventsInPeriod(
  events: IEvent[],
  periodStart: Date,
  periodEnd: Date,
  visibleHours: TVisibleHours
) {
  const minStartTime = visibleHours.from;
  const maxEndTime = visibleHours.to;

  const eventList: IEvent[] = [];

  events.forEach((element) => {
    const currentStartDate = element.startDate;
    const currentEndDate = element.endDate;

    //const totalDaysBetween = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate));
    const totalDaysBetween = differenceInDays(currentEndDate, currentStartDate);

    if (totalDaysBetween === 0) {
      eventList.push(element);
      return;
    }

    for (let index = 0; index < totalDaysBetween; index++) {
      const newEvent = { ...element, eventIsSplit: true };

      const newDay = set(addDays(currentStartDate, index), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

      if (!isWithinInterval(newDay, { start: periodStart, end: periodEnd })) {
        continue;
      }

      if (index === 0) {
        //First Day
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;
        newEvent.endDate = set(currentStartDate, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 });
      } else if (index === totalDaysBetween) {
        //LAST DAY
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;
        newEvent.startDate = set(currentEndDate, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 });
      } else {
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;

        newEvent.startDate = set(newDay, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 });
        newEvent.endDate = set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 });
        //MIDDLE DAY
      }
      eventList.push(newEvent);
    }
  });

  return eventList;
}

function setPartsToUTCDate(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}

function setUTCPartsToDate(d: Date) {
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds()
  );
}

function useEvents(startDate: Date, endDate: Date): { events: IEvent[] | undefined; isLoading: boolean; isError: any } {
  const { data, error, isLoading } = useSWR<IEvent[]>(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  return {
    events: data ? SEvents.parse(data) : undefined,
    isLoading,
    isError: error,
  };
}

function useRecurrence(
  startDate: Date,
  endDate: Date
): { events: IEvent[] | undefined; isLoading: boolean; isError: any } {
  const { data, error, isLoading } = useSWR<IEvent[]>(
    `/api/recurrences?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  return {
    events: data ? SEvents.parse(data) : undefined,
    isLoading,
    isError: error,
  };
}

/**
 *
 * @param startDate
 * @param endDate
 * @returns
 */
async function getEvents(startDate: Date, endDate: Date): Promise<{ data: IEvent[]; error: string | undefined }> {
  /*########################################################
      REVALIDATION ONLY WORKS ON SERVER FETCH REQUESTS
      --IF YOU DO THIS SAME CALL ON A CLIENT COMPONENTS USE-EFFECT FUNCTION IT WONT REVALIDATE ON TAG OR TIME
  ########################################################*/
  const res = await fetch(
    `${process.env.NEXTAPP_URL}/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
    /*{
      cache: "force-cache",
      next: { tags: ["EventsUpdated"], revalidate: 30 },
    }*/
  );
  const data = await res.json();

  if (res.status !== 200) {
    return { data: [], error: data.error };
  }

  //...generateMultiDayBlocks(newEvent, VISIBLE_HOURS)
  data.map((event: IEvent) => {
    event.startDate = new Date(event.startDate);
    event.endDate = new Date(event.endDate);
  });

  return { data: data, error: undefined };
}

export async function getEventsYearly(selectedDate: Date) {
  const StartOfYear = startOfYear(selectedDate);
  const EndOfYear = endOfYear(selectedDate);

  const eventList = await getEvents(StartOfYear, EndOfYear);

  return eventList;
}

export async function getEventsMonthly(selectedDate: Date) {
  const StartOfMonth = startOfMonth(selectedDate);
  const EndOfMonth = endOfMonth(selectedDate);

  const eventList = await getEvents(StartOfMonth, EndOfMonth);

  return eventList;
}

export async function getEventsWeekly(selectedDate: Date) {
  const StartOfWeek = startOfWeek(selectedDate);
  const EndOfWeek = endOfWeek(selectedDate);

  const eventList = await getEvents(StartOfWeek, EndOfWeek);

  return eventList;
}

export async function getEventsDaily(selectedDate: Date) {
  const StartOfDay = startOfDay(selectedDate);
  const EndOfDay = endOfDay(selectedDate);

  const eventList = await getEvents(StartOfDay, EndOfDay);

  return eventList;
}

export async function getEvent(eventID: number): Promise<{ data: IEvent[]; error: string | undefined }> {
  const res = await fetch(`${process.env.NEXTAPP_URL}/api/events/${eventID}`, {
    cache: "no-cache",
  });
  const data = await res.json();

  if (res.status !== 200) {
    return { data: [], error: data.error };
  }

  data.map((event: IEvent) => {
    event.startDate = new Date(event.startDate);
    event.endDate = new Date(event.endDate);
  });

  return { data: data, error: undefined };
}

export async function createEvent(event: IEvent) {
  const res = await fetch(`${process.env.NEXTAPP_URL}/api/events`, {
    body: JSON.stringify(event),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const data = await res.json();

  if (res.status !== 200) {
    return { data: [], error: data.error };
  }

  data.map((event: IEvent) => {
    event.startDate = new Date(event.startDate);
    event.endDate = new Date(event.endDate);
  });

  return { data: data, error: undefined };
}

export async function updateEvent(event: IEvent) {
  const res = await fetch(`${process.env.NEXTAPP_URL}/api/events`, {
    body: JSON.stringify(event),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });

  const data = await res.json();

  if (res.status !== 200) {
    return { data: [], error: data.error };
  }
  //await revalidateEventCache();
  /*data.map((event: IEvent) => {
    event.startDate = new Date(event.startDate);
    event.endDate = new Date(event.endDate);
  });*/

  return { data: data, error: undefined };
}
