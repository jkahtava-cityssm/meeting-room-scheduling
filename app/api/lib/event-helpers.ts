import { TVisibleHours } from "@/lib/types";
import { addDays, differenceInDays, endOfDay, isWithinInterval, parseISO, set, startOfDay } from "date-fns";
import { rrulestr } from "rrule";
import { UTCDate } from "@date-fns/utc";
import { IEvent } from "@/lib/schemas/calendar";

export function generateRecurringEventsInPeriod(events: IEvent[], periodStart: UTCDate, periodEnd: UTCDate) {
  const eventList: IEvent[] = [];

  events.forEach((element) => {
    if (!element.recurrenceId) {
      return;
    }
    if (!element.recurrence?.rule) {
      return;
    }

    const currentRule = element.recurrence.rule as string;

    const rrule = rrulestr(currentRule, { cache: true });
    const recurrenceArray = rrule.between(periodStart, periodEnd);

    for (let index = 0; index < recurrenceArray.length; index++) {
      const newEvent = { ...element };
      const recurringDate = new UTCDate(recurrenceArray[index]);
      newEvent.title = "Series - " + newEvent.title;
      newEvent.startDate = set(newEvent.startDate, {
        year: recurringDate.getUTCFullYear(),
        month: recurringDate.getUTCMonth(),
        date: recurringDate.getUTCDate(),
      });
      newEvent.endDate = set(newEvent.endDate, {
        year: recurringDate.getUTCFullYear(),
        month: recurringDate.getUTCMonth(),
        date: recurringDate.getUTCDate(),
      });

      eventList.push(newEvent);
    }
  });
  return eventList;
}

export function generateMultiDayEventsInPeriod(
  events: IEvent[],
  periodStart: UTCDate,
  periodEnd: UTCDate,
  visibleHours: TVisibleHours
) {
  const minStartTime = visibleHours.from;
  const maxEndTime = visibleHours.to;

  const eventList: IEvent[] = [];

  events.forEach((element) => {
    if (element.recurrenceId !== null) {
      return;
    }
    const currentStartDate = new UTCDate(element.startDate);
    const currentEndDate = new UTCDate(element.endDate);

    const totalDaysBetween = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate));
    //const totalDaysBetween = differenceInDays(currentEndDate, currentStartDate);

    if (totalDaysBetween === 0) {
      eventList.push(element);
      return;
    }

    for (let index = 0; index <= totalDaysBetween; index++) {
      const newEvent = { ...element, eventIsSplit: true };

      const newDay = new UTCDate(
        set(addDays(currentStartDate, index), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
      );

      if (!isWithinInterval(newDay, { start: periodStart, end: periodEnd })) {
        continue;
      }

      if (index === 0) {
        //First Day
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " - " + newEvent.title;
        newEvent.endDate = new UTCDate(
          set(currentStartDate, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 })
        );
        newEvent.multiDay = { position: "first" };
      } else if (index === totalDaysBetween) {
        //LAST DAY
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " - " + newEvent.title;
        newEvent.startDate = new UTCDate(
          set(currentEndDate, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 })
        );
        newEvent.multiDay = { position: "last" };
      } else {
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " - " + newEvent.title;

        newEvent.startDate = new UTCDate(set(newDay, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 }));
        newEvent.endDate = new UTCDate(set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 }));
        newEvent.multiDay = { position: "middle" };
        //MIDDLE DAY
      }
      eventList.push(newEvent);
    }
  });

  return eventList;
}
