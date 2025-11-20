"use client";

import { useClientSession } from "@/hooks/use-client-auth";
import { IEvent } from "@/lib/schemas/calendar";

import { useEventPatchMutation, useEventsByStatusQuery } from "@/services/events";
import { startOfMonth, endOfMonth, parse, formatISO } from "date-fns";

import { redirect, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { processBookingRequestEvents } from "@/app/features/bookings/workers/booking-request-webworker";
import RequestHeader from "@/app/features/bookings/components/request-header";
import BookingList from "@/app/features/bookings/components/booking-list";
import { ISection } from "@/app/features/bookings/components/types";
import { Skeleton } from "@/components/ui/skeleton";
import SkeletonBookingList from "@/app/features/bookings/components/skeleton-booking-list";
import { BookingProvider } from "../context/BookingProvider";

export interface IUserRequestProcessData {
  events: IEvent[];
  roomId: string;
}

export interface IUserRequestResponseData {
  totalEvents: number;
  sections: ISection[];
}
function getViewDate(dateParam: string | null) {
  return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, "yyyy-MM-dd", new Date());
}

function removeTimeFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function UserRequests() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("selectedDate");
  const viewParam = searchParams.get("view");

  const dateValue = useMemo(() => {
    return getViewDate(dateParam);
  }, [dateParam]);

  const { session, isPending } = useClientSession();
  const startDate: Date = startOfMonth(dateValue);
  const endDate: Date = endOfMonth(dateValue);

  const [sections, setSections] = useState<ISection[]>([]);
  const [totalEvents, setTotalEvents] = useState<number>(0);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  const { data: events } = useEventsByStatusQuery(startDate, endDate, "1");

  const [roomId, setRoomId] = useState<string>("-1");

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    setLoading(true);
  }, [dateValue]);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications

    if (workerRef.current) {
      return;
    }

    const newWorker = new Worker(
      new URL("@/app/features/bookings/workers/booking-request-webworker.ts", import.meta.url)
    );

    newWorker.onmessage = (message: MessageEvent<IUserRequestResponseData>) => {
      setSections(message.data.sections);
      setTotalEvents(message.data.totalEvents);
      setLoading(false);
    };

    workerRef.current = newWorker;

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [dateValue]);

  useEffect(() => {
    if (!events) {
      return;
    }

    if (workerRef.current) {
      const data: IUserRequestProcessData = {
        events: events,
        roomId: roomId,
      };
      //setLoading(true);
      //setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, dateValue, roomId, isRefreshed]);

  if (isPending) {
    return <div>Verifying Access</div>;
  }

  if (!session) {
    //console.log("User Requests No session, redirecting to login");
    redirect("/");
  }

  const breakpoints = true
    ? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
    : "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";
  const view = "day";

  return (
    <>
      <RequestHeader
        view={view}
        date={dateValue}
        roomId={roomId}
        isHeaderLoading={isLoading}
        totalEvents={totalEvents}
        OnRoomChange={(value) => {
          setRoomId(value);
        }}
      />
      {isLoading && <SkeletonBookingList />}
      <BookingProvider
        value={{
          startDate: formatISO(startDate),
          endDate: formatISO(endDate),
          type: "status",
          id: "1",
        }}
      >
        {!isLoading && <BookingList sections={sections} />}
      </BookingProvider>
    </>
  );
}
