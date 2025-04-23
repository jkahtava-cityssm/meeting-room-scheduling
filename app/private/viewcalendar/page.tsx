import AuthProvider from "@/app/component/AuthProvider";
import { ClientContainer } from "@/calendar/components/client-container";
import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IEvent, IUser } from "@/calendar/interfaces";

const events: IEvent[] = [
  {
    id: 111,
    title: "string",
    description: "string",
    startDate: "2025-01-01", // ISO string
    endDate: "2025-01-01", // ISO string
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

export default async function Home() {
  return (
    <AuthProvider>
      <CalendarProvider events={events} users={users}>
        <div>PRIVATE SUBFOLDER</div>
        <ClientContainer view="month" />
      </CalendarProvider>
    </AuthProvider>
  );
}
