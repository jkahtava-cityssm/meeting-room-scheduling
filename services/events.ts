//import { IEvent } from "@/calendar/interfaces";
import { IEvent } from "@/calendar/interfaces";
import { prisma } from "@/prisma";
import { Room } from "@prisma/client";
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

async function getEvents(startDate: Date, endDate: Date): Promise<{ data: IEvent[]; error: string | undefined }> {
  const res = await fetch(`/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`, {
    cache: "force-cache",
  });
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
  const res = await fetch(`/api/events/${eventID}`, {
    cache: "force-cache",
  });
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
