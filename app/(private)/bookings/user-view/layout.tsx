import { CalendarProvider } from "@/contexts/CalendarProvider";
import React from "react";

export default async function UserCalendarLayout({ children }: { children: React.ReactNode }) {
  //const rooms = await prisma.room.findMany({});

  return <CalendarProvider>{children}</CalendarProvider>;
}
