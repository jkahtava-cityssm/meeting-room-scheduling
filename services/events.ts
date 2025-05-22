//"use server";
//import { IEvent } from "@/calendar/interfaces";
import { IRecurrence, IRoom } from "@/components/calendar/lib/interfaces";
import { prisma } from "@/prisma";

import { Event, Room } from "@prisma/client";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { revalidateTag } from "next/cache";
import { revalidateEventCache } from "./actions";

import useSWR from "swr";
import { date, z } from "zod";

export const SRoom = z.object({
  roomId: z.number(),
  color: z.string().min(1, "Colour is required"),
  name: z.string().min(1, "Name is required"),
  createdAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  updatedAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  icon: z.string().nullable(),
});

export const SRecurrence = z.object({
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
  recurrence: SRecurrence.optional(),
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
  recurrence?: IRecurrence;
  createdAt: Date;
  updatedAt: Date;
}

const SEvents = z.array(SEvent);

export function useDailyEvents(selectedDate: Date) {
  const StartOfDay = startOfDay(selectedDate);
  const EndOfDay = endOfDay(selectedDate);

  return useEvents(StartOfDay, EndOfDay);
}

function useEvents(startDate: Date, endDate: Date): { events: IEvent[] | undefined; isLoading: boolean; isError: any } {
  const { data, error, isLoading } = useSWR<IEvent[]>(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  if (data) {
    console.log(data);
    //console.log(SEvents.parse(data));
    const b: IEvent[] = SEvents.parse(data);
    console.log(b);
  }

  return {
    events: data,
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
