import { TVisibleHours } from '@/lib/types';
import { addDays, differenceInDays, endOfDay, isWithinInterval, set, startOfDay, subMinutes } from 'date-fns';
import { rrulestr } from 'rrule';
import { IEvent } from './schemas';

function isMidnight(date: Date) {
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

function endsAtMidnight(startDate: Date, endDate: Date): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (!isMidnight(end)) return false;

  return start.getTime() !== end.getTime();
}

function getAdjustedEndDateForMultiDay(originalEndDate: Date): Date {
  const end = new Date(originalEndDate);

  if (isMidnight(end)) {
    return subMinutes(end, 1);
  }

  return end;
}

export function generateRecurringEventsInPeriod(events: IEvent[], periodStart: Date, periodEnd: Date) {
  const eventList: IEvent[] = [];

  const startUTC = setPartsToUTCDate(periodStart);
  const endUTC = setPartsToUTCDate(periodEnd);
  //let testA;
  //let testB;
  //let con;
  for (const event of events) {
    if (!event.recurrenceId || !event.recurrence?.rule) continue;

    const rrule = rrulestr(event.recurrence.rule, { cache: true });
    //con = rrule.all()[0];
    //const recurrenceDates2 = rrule.between(periodStart, periodEnd, true);
    const recurrenceDates = rrule.between(startUTC, endUTC, true);

    //testA = recurrenceDates2;
    //testB = recurrenceDates;
    for (const recurrenceDate of recurrenceDates) {
      const recurringUTC = setUTCPartsToDate(recurrenceDate);

      const year = recurringUTC.getFullYear();
      const month = recurringUTC.getMonth();
      const date = recurringUTC.getDate();

      eventList.push({
        ...event,
        title: 'Series' + (event.title ? ' - ' + event.title : ''),
        startDate: set(event.startDate, { year, month, date }).toISOString(),
        endDate: set(event.endDate, { year, month, date }).toISOString(),
      });
    }
  }
  return eventList;
}

export function generateMultiDayEventsInPeriod(events: IEvent[], periodStart: Date, periodEnd: Date, minStartTime: number, maxEndTime: number) {
  const eventList: IEvent[] = [];

  for (const event of events) {
    if (event.recurrenceId !== null) continue;

    const currentStartDate = new Date(event.startDate);
    const currentEndDate = new Date(event.endDate);

    const endAtMidnight = endsAtMidnight(currentStartDate, currentEndDate);
    const adjustedEndDate = endAtMidnight ? getAdjustedEndDateForMultiDay(currentEndDate) : currentEndDate;

    const totalDaysBetween = differenceInDays(endOfDay(adjustedEndDate), startOfDay(currentStartDate));

    if (totalDaysBetween === 0) {
      eventList.push({
        ...event,
        multiDay: endAtMidnight
          ? {
              position: 'single',
              calculatedDate: currentStartDate.toISOString(),
              isEndAtMidnight: true,
              originalEndDate: currentEndDate.toISOString(),
            }
          : undefined,
      });
      continue;
    }

    for (let dayIndex = 0; dayIndex <= totalDaysBetween; dayIndex++) {
      const newDay = set(addDays(currentStartDate, dayIndex), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

      if (!isWithinInterval(newDay, { start: periodStart, end: periodEnd })) {
        continue;
      }

      const newEvent = {
        ...event,

        title: `Day ${dayIndex + 1} of ${totalDaysBetween + 1}` + (event.title ? ' - ' + event.title : ''),
      };

      if (dayIndex === 0) {
        //First Day
        newEvent.endDate = set(currentStartDate, {
          hours: maxEndTime,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();
        newEvent.multiDay = { position: 'first', calculatedDate: currentStartDate.toISOString() };
      } else if (dayIndex === totalDaysBetween) {
        //LAST DAY
        newEvent.startDate = set(adjustedEndDate, {
          hours: minStartTime,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();

        newEvent.multiDay = {
          position: 'last',
          calculatedDate: adjustedEndDate.toISOString(),
          isEndAtMidnight: endAtMidnight,
          originalEndDate: endAtMidnight ? currentEndDate.toISOString() : undefined,
        };
      } else {
        newEvent.startDate = set(newDay, {
          hours: minStartTime,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();
        newEvent.endDate = set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString();
        newEvent.multiDay = { position: 'middle', calculatedDate: newDay.toISOString() };
        //MIDDLE DAY
      }
      eventList.push(newEvent);
    }
  }
  return eventList;
}

function setPartsToUTCDate(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}

function setUTCPartsToDate(d: Date) {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
}
