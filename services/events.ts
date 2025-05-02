//import { IEvent } from "@/calendar/interfaces";
import { IEvent } from "@/calendar/interfaces";
import { prisma } from "@/prisma";
import { Room } from "@prisma/client";

export async function getEvents(startDate: Date, endDate: Date) {
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

  return data;
}
