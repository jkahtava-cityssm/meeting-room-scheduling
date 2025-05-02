//import { IEvent } from "@/calendar/interfaces";
import { IEvent, IRoom } from "@/calendar/interfaces";
import { prisma } from "@/prisma";
import { Room } from "@prisma/client";

export async function getRooms() {
  const res = await fetch("/api/rooms");
  const data = await res.json();

  if (res.status !== 200) {
    return { data: [], error: data.error };
  }

  return data;
}
