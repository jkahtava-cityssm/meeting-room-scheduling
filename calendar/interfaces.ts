import type { TColors } from "@/calendar/types";

export interface IRoom {
  id: string;
  name: string;
  color: TColors;
  picturePath: string | null;
}

export interface ISubEvent {
  index: number;
  startDate: string;
  endDate: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  subevent: ISubEvent | null;
  room: IRoom;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
