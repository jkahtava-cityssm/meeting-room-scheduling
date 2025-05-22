"use server";
//import { IEvent } from "@/calendar/interfaces";
import { IEvent } from "@/components/calendar/lib/interfaces";
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
import { revalidateTag } from "next/cache";
import { revalidateEventCache } from "./actions";

/**
 *
 * @param startDate
 * @param endDate
 * @returns
 */
async function getRecurrences(startDate: Date, endDate: Date): Promise<{ data: IEvent[]; error: string | undefined }> {
  /*########################################################
      REVALIDATION ONLY WORKS ON SERVER FETCH REQUESTS
      --IF YOU DO THIS SAME CALL ON A CLIENT COMPONENTS USE-EFFECT FUNCTION IT WONT REVALIDATE ON TAG OR TIME
  ########################################################*/
  const res = await fetch(
    `${process.env.NEXTAPP_URL}/api/recurrences?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`,
    {
      cache: "force-cache",
      next: { tags: ["RecurrenceUpdated"], revalidate: 30 },
    }
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

export async function getRecurrencesYearly(selectedDate: Date) {
  const StartOfYear = startOfYear(selectedDate);
  const EndOfYear = endOfYear(selectedDate);

  const eventList = await getRecurrences(StartOfYear, EndOfYear);

  return eventList;
}

export async function getRecurrencesMonthly(selectedDate: Date) {
  const StartOfMonth = startOfMonth(selectedDate);
  const EndOfMonth = endOfMonth(selectedDate);

  const eventList = await getRecurrences(StartOfMonth, EndOfMonth);

  return eventList;
}

export async function getRecurrencesWeekly(selectedDate: Date) {
  const StartOfWeek = startOfWeek(selectedDate);
  const EndOfWeek = endOfWeek(selectedDate);

  const eventList = await getRecurrences(StartOfWeek, EndOfWeek);

  return eventList;
}

export async function getRecurrencesDaily(selectedDate: Date) {
  const StartOfDay = startOfDay(selectedDate);
  const EndOfDay = endOfDay(selectedDate);

  const eventList = await getRecurrences(StartOfDay, EndOfDay);

  return eventList;
}
