import type { TColors } from "@/calendar/types";

export interface IRoom {
  id: string;
  name: string;
  color: TColors;
  picturePath: string | null;
}

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

export interface IEvent {
  id: number;
  key: string;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  room: IRoom;
  parentEvent: IEvent | null;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
