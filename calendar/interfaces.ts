import type { TColors } from "@/calendar/types";
import type { Event, Room } from "@prisma/client";

export interface IRoom extends Room {}

export interface IMultiDayBlock {
  parentID: number;
  key: string;
  startDate: string;
  endDate: string;
  title: string;
}
/*
export interface IEvent {
  id: number;
  key: string;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  multiDayBlocks: IMultiDayBlock[];
  room: IRoom;
}
*/

export interface IEvent extends Event {}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
