import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IEvent, IUser } from "@/calendar/interfaces";

const events: IEvent[] = [
  {
    id: 111,
    title: "string",
    description: "string",
    startDate: "2025-04-22T08:00", // ISO string
    endDate: "2025-04-24T11:30", // ISO string
    color: "blue",
    user: {
      id: "string",
      name: "string",
      picturePath: null,
    },
  },
  {
    id: 112,
    title: "string",
    description: "string",
    startDate: "2025-04-22T09:30", // ISO string
    endDate: "2025-04-22T13:30", // ISO string
    color: "blue",
    user: {
      id: "string",
      name: "string",
      picturePath: null,
    },
  },
];
const users: IUser[] = [
  {
    id: "string",
    name: "string",
    picturePath: null,
  },
];

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CalendarProvider events={events} users={users}>
      {children}
    </CalendarProvider>
  );
}
