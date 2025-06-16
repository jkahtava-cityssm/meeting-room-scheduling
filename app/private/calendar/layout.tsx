import { CalendarProvider } from "@/contexts/CalendarProvider";
import React from "react";

export default async function CalendarLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  //const rooms = await prisma.room.findMany({});

  return (
    <CalendarProvider>
      {modal}
      {children}
    </CalendarProvider>
  );
}
