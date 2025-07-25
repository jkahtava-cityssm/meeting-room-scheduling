import { IEvent, SEvent } from "@/lib/schemas/calendar";
import { eachDayOfInterval, format, isSameDay, isSameMonth, isSunday, isToday, parse } from "date-fns";

import { IDayView, IEventView, IMonthProcessData, IMonthResponseData, IWeekView } from "../calendar-month-view";
import { z } from "zod/v4";
import { uniq, uniqBy } from "lodash";

import { filterEventsByRoom, getDaysInView } from "../../../lib/helpers";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";

self.onmessage = (event: MessageEvent<IMonthProcessData>) => {
  if (event.data) {
    const result = processMonthEvents(event.data);
    self.postMessage(result);
  }
};

function processMonthEvents(monthData: IMonthProcessData): IMonthResponseData {
  const { startDate: monthStart, endDate: monthEnd } = getDaysInView(monthData.selectedDate);

  const combinedEvents: IEvent[] = [
    ...generateMultiDayEventsInPeriod(monthData.events, monthStart, monthEnd, { from: 0, to: 24 }),
    ...generateRecurringEventsInPeriod(monthData.events, monthStart, monthEnd),
  ];

  const events = z.array(SEvent).parse(combinedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, monthData.selectedRoomId);

  filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const packedEvents = packEvents(filteredEvents, monthStart, monthEnd, monthData.multiDayEventsAtTop);

  const dayViews: IDayView[] = [];
  const weekViews: IWeekView[] = [];

  let index = 0;

  for (const day in packedEvents) {
    const parsedDate = parse(day, "yyyy-MM-dd", new Date());
    const dailyEvents = filteredEvents.filter((event) => {
      return format(event.startDate, "yyyy-MM-dd") === day;
    });

    const eventViews: IEventView[] = [];

    for (let index = 0; index < packedEvents[day].length; index++) {
      const packedEventId = packedEvents[day][index];

      if (packedEventId !== null) {
        const matchingEvent = dailyEvents.find((event) => event.eventId === packedEventId);
        const position = matchingEvent?.multiDay ? matchingEvent.multiDay.position : "none";
        const newEventView: IEventView = { index: index, position: position, event: matchingEvent };
        eventViews.push(newEventView);
      }
    }

    const dayView: IDayView = {
      day: parsedDate.getDate(),
      dayDate: parsedDate,
      eventRecords: eventViews,
      isToday: isToday(parsedDate),
      isSunday: isSunday(parsedDate),
      isCurrentMonth: isSameMonth(monthData.selectedDate, parsedDate),
    };

    dayViews.push(dayView);

    const weekIndex = Math.floor(index / 7);
    if (weekViews.length < weekIndex + 1) {
      weekViews.push({ week: weekIndex, maxDailyEvents: 0, dayViews: [] });
      weekViews[weekIndex].dayViews.push(dayView);
    } else {
      weekViews[weekIndex].dayViews.push(dayView);
    }

    index++;
  }

  let totalEventsInMonth = 0;
  for (let week = 0; week < weekViews.length; week++) {
    let mostEventsInDay = 0;
    for (let day = 0; day < weekViews[week].dayViews.length; day++) {
      const total = weekViews[week].dayViews[day].eventRecords.length;
      if (total > mostEventsInDay) {
        mostEventsInDay = total;
      }

      if (weekViews[week].dayViews[day].isCurrentMonth) {
        totalEventsInMonth += total;
      }
    }
    weekViews[week].maxDailyEvents = mostEventsInDay;
  }

  return { dayViews: dayViews, totalEvents: totalEventsInMonth, weekViews: weekViews };
}

function getMaxEventsInDay(listOfDaysInMonth: Date[], events: IEvent[]) {
  let totalEventsInDay = 0;

  listOfDaysInMonth.forEach((day) => {
    const totalEventToday = events.filter((event: IEvent) => {
      return isSameDay(day, event.startDate);
    }).length;

    if (totalEventToday > totalEventsInDay) {
      totalEventsInDay = totalEventToday;
    }
  });

  return totalEventsInDay;
}
/**
 *
 * @param parsedEvents requires a sorted event list that is parsed by zod
 * @param startDate
 * @param endDate
 * @returns
 */
function packEvents(parsedEvents: IEvent[], startDate: Date, endDate: Date, multiDayEventsAtTop: boolean) {
  const listOfDaysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  const eventPositions: { [key: string]: (number | null)[] } = {};

  const maxEvents = getMaxEventsInDay(listOfDaysInMonth, parsedEvents);

  listOfDaysInMonth.forEach((day) => {
    //occupiedPositions[day.toISOString()] = [false, false, false];
    eventPositions[format(day, "yyyy-MM-dd")] = [
      ...Array(maxEvents)
        .keys()
        .map(() => {
          return null;
        }),
    ];
  });
  mutateMultiDayEventPositions(parsedEvents, eventPositions, multiDayEventsAtTop);
  mutateSingleDayEventPositions(parsedEvents, eventPositions, listOfDaysInMonth);

  return eventPositions;
}

function mutateMultiDayEventPositions(
  parsedEvents: IEvent[],
  eventPositions: { [key: string]: (number | null)[] },
  multiDayEventsAtTop: boolean = false
) {
  const multiDayEvents = parsedEvents.filter((event: IEvent) => {
    return event.multiDay !== undefined;
  });

  const firstDayEvents = uniqBy(multiDayEvents, "eventId");
  const firstDaysToProcess = uniq(
    firstDayEvents.map((event) => {
      return format(event.startDate, "yyyy-MM-dd");
    })
  );

  firstDaysToProcess.forEach((dateString) => {
    //GET THE POSITION LIST
    const currentDay = eventPositions[dateString];
    //GET THE MULTIDAY EVENTID'S THAT HAVE THEIR FIRST DAY ON TODAY
    const multiDayEvents = firstDayEvents
      .filter((event) => {
        return dateString === format(event.startDate, "yyyy-MM-dd");
      })
      .map((event) => {
        return event.eventId;
      });
    //GET ALL THE EVENTS THAT OCCUR TODAY INCLUDING THE MULTI DAY EVENTS
    const eventsToday = parsedEvents.filter((event: IEvent) => {
      const isMultiDayFilter = multiDayEventsAtTop ? multiDayEvents.includes(event.eventId) : true;
      const isMatchingDate = dateString === format(event.startDate, "yyyy-MM-dd");
      return isMatchingDate && isMultiDayFilter;
    });

    //ADD ALL THE EVENTS INTO THEIR POSITIONS
    eventsToday.forEach((currentEvent) => {
      //IF THE EVENT ALREADY EXISTS IN THE CURRENT POSITION LIST SKIP IT

      if (currentDay.includes(currentEvent.eventId)) {
        return;
      }

      for (let index = 0; index < currentDay.length; index++) {
        //IF THE POSITION IS EMPTY ADD AN EVENT
        if (currentDay[index] === null) {
          //CHECK IF THE EVENT BEING ADDED IS A MULTI-DAY EVENT
          eventPositions[dateString][index] = currentEvent.eventId;

          if (multiDayEvents.includes(currentEvent.eventId)) {
            //GET THE WHOLE SERIES FOR THE GIVEN MULTI-DAY EVENT
            const multiDayEventSeries = parsedEvents.filter((event) => {
              return currentEvent.eventId === event.eventId && event.multiDay !== undefined;
            });
            //UPDATE ALL OF THE POSITIONS IN EVERY OTHER DAY THAT THIS SERIES INTERSECTS WITH
            multiDayEventSeries.forEach((series) => {
              eventPositions[format(series.startDate, "yyyy-MM-dd")][index] = currentEvent.eventId;
            });
          }
          return;
        }
      }
    });
  });

  //IF ALL THE MULTI DAY EVENTS ARE AT THE TOP WE NEED TO ADD IN SOME BLANK VALUES
  //TO ENSURE THAT THE SYSTEM DOESNT INSERT EVENTS
  //WE ALSO THEN NEED TO EXTEND THE EVENTPOSITION ARRAY BECAUSE SOME EVENTS WILL NO LONGER FIT
  if (multiDayEventsAtTop) {
    let maxMultiEventIndex = 0;

    for (const day in eventPositions) {
      let lastEventIdIndex = 0;
      //FIND THE LAST MULTI-DAY EVENT ADDED
      for (let index = 0; index < eventPositions[day].length; index++) {
        const eventId = eventPositions[day][index];
        if (eventId !== null) {
          lastEventIdIndex = index;
        }
      }
      //NOW WE KNOW THE LAST INDEX FILL THE SPOTS BETWEEN
      for (let index = 0; index < lastEventIdIndex; index++) {
        const eventId = eventPositions[day][index];
        if (eventId === null) {
          eventPositions[day][index] = 0;
        }
      }

      if (lastEventIdIndex > maxMultiEventIndex) {
        maxMultiEventIndex = lastEventIdIndex;
      }
    }
    //NOW WE HAVE THE MAXIMUM MULTI EVENT LOCATION WE CAN EXPAND THE ARRAY BY THAT NUMBER
    for (const day in eventPositions) {
      for (let index = 0; index < maxMultiEventIndex; index++) {
        eventPositions[day].push(null);
      }
    }
  }
}

function mutateSingleDayEventPositions(
  parsedEvents: IEvent[],
  eventPositions: { [key: string]: (number | null)[] },
  listOfDaysInMonth: Date[]
) {
  listOfDaysInMonth.forEach((currentDate) => {
    const dateString = format(currentDate, "yyyy-MM-dd");
    //GET THE POSITION LIST
    const currentDay = eventPositions[dateString];

    //GET ALL THE EVENTS THAT OCCUR TODAY INCLUDING THE MULTI DAY EVENTS
    const eventsToday = parsedEvents.filter((event: IEvent) => {
      return dateString === format(event.startDate, "yyyy-MM-dd");
    });

    //ADD ALL THE EVENTS INTO THEIR POSITIONS
    eventsToday.forEach((currentEvent) => {
      //IF THE EVENT ALREADY EXISTS IN THE CURRENT POSITION LIST SKIP IT
      if (currentDay.includes(currentEvent.eventId)) {
        return;
      }

      for (let index = 0; index < currentDay.length; index++) {
        //IF THE POSITION IS EMPTY ADD AN EVENT
        if (currentDay[index] === null) {
          //CHECK IF THE EVENT BEING ADDED IS A MULTI-DAY EVENT
          eventPositions[dateString][index] = currentEvent.eventId;
          return;
        }
      }
    });
  });
}
/*
function getDaysInView(selectedDate: Date) {
  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDayOfMonth = startOfMonth(selectedDate);
  const beforeDays = firstDayOfMonth.getDay();

  const daysInLastRow = (daysInMonth + beforeDays) % 7;
  const afterDays = daysInLastRow > 0 ? 7 - daysInLastRow : 0;
  const firstDate = subDays(selectedDate, beforeDays);
  const lastDate = addDays(firstDayOfMonth, daysInMonth + afterDays - 1);

  return { startDate: firstDate, endDate: lastDate };
}*/
