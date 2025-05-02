import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IEvent, IRoom } from "@/calendar/interfaces";
import { CALENDAR_EVENTS_MOCK, CALENDAR_ROOMS_MOCK } from "@/calendar/mocks";
import { prisma } from "@/prisma";
import { getRooms } from "@/services/rooms";
import { Suspense } from "react";

export default async function Layout({ children }: { children: React.ReactNode }) {
  //const rooms = await prisma.room.findMany({});

  return (
    <CalendarProvider>
      <div className="overflow-hidden rounded-xl border">{children}</div>
    </CalendarProvider>
  );
}
