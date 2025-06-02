import { CalendarProvider } from "@/contexts/CalendarProvider";

export default async function Layout({ children }: { children: React.ReactNode }) {
  //const rooms = await prisma.room.findMany({});

  return <CalendarProvider>{children}</CalendarProvider>;
}
