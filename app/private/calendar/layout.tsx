import { CalendarProvider } from "@/contexts/calendar-context";

export default async function Layout({ children }: { children: React.ReactNode }) {
  //const rooms = await prisma.room.findMany({});

  return (
    <CalendarProvider>
      <div className="rounded-xl border">{children}</div>
    </CalendarProvider>
  );
}
