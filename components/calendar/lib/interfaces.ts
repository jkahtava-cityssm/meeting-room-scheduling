import type { TColors } from "@/components/calendar/lib/types";
import type { Event, Room } from "@prisma/client";

export interface IRoom extends Room {
  roomId: number;
  color: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  icon: string | null;
}

export interface IEvent extends Event {
  eventId: number;
  roomId: number;
  startDate: Date;
  endDate: Date;
  title: string;
  description: string;
  parentEventId: number | null;
  eventIsSplit: boolean;
  room: IRoom;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
