import { CALENDAR_EVENTS_MOCK, CALENDAR_ROOMS_MOCK } from "@/calendar/mocks";

export const getEvents = async () => {
  // TO DO: implement this
  // Increase the delay to better see the loading state
  // await new Promise(resolve => setTimeout(resolve, 800));
  return CALENDAR_EVENTS_MOCK;
};

export const getRooms = async () => {
  // TO DO: implement this
  // Increase the delay to better see the loading state
  // await new Promise(resolve => setTimeout(resolve, 800));
  return CALENDAR_ROOMS_MOCK;
};
