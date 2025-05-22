import type { TColors } from "@/components/calendar/lib/types";
import type { Event, Recurrence, Room } from "@prisma/client";

export interface IRoom extends Room {
  roomId: number;
  color: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  icon: string | null;
}

export interface IRecurrence extends Recurrence {
  createdAt: Date;
  updatedAt: Date;
  recurrenceId: number;
  recurrenceCancellationId: number | null;
  recurrenceExceptionId: number | null;
  rule: string;
  startDate: Date;
  endDate: Date;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
