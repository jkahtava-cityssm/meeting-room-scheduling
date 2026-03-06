"use client";

import { useSession } from "@/contexts/SessionProvider";
import { IEvent } from "@/lib/schemas/calendar";

import { useEventPatchMutation, useEventsByStatusQuery } from "@/lib/services/events";
import { startOfMonth, endOfMonth, parse, formatISO, startOfDay, endOfDay, endOfYear, startOfYear } from "date-fns";

import { redirect, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import RequestHeader from "@/app/features/bookings/components/request-header";
import BookingList from "@/app/features/bookings/components/booking-list";
import { ISection } from "@/app/features/bookings/components/types";
import SkeletonBookingList from "@/app/features/bookings/components/skeleton-booking-list";
import { BookingProvider } from "../context/BookingProvider";
import CalendarMonthPicker from "@/components/calendar-month-picker/CalendarMonthPicker";
import CalendarYearPicker from "@/components/calendar-year-picker/CalendarYearPicker";
import { TCalendarView } from "@/lib/types";
import { CalendarDayPicker } from "@/components/calendar-day-picker/CalendarDayPicker";
import BookingListByRoom from "./booking-list-by-room";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

function getDateRange(view: TCalendarView, dateValue: Date) {
	if (view === "day") {
		return { startDate: startOfDay(dateValue), endDate: endOfDay(dateValue) };
	}

	if (view === "month") {
		return { startDate: startOfMonth(dateValue), endDate: endOfMonth(dateValue) };
	}
	if (view === "year") {
		return { startDate: startOfYear(dateValue), endDate: endOfYear(dateValue) };
	}
	if (view === "all") {
		return {
			startDate: parse("0001-01-01", "yyyy-MM-dd", new Date()),
			endDate: parse("9999-12-31", "yyyy-MM-dd", new Date()),
		};
	}

	return { startDate: startOfDay(dateValue), endDate: endOfDay(dateValue) };
}

export default function UserRequests() {
	const searchParams = useSearchParams();
	const dateParam = searchParams.get("selectedDate");
	const viewParam = searchParams.get("view");

	const view = viewParam === null ? "day" : viewParam;

	const dateValue = useMemo(() => {
		return getViewDate(dateParam);
	}, [dateParam]);

	const { session, isPending } = useSession();

	const { startDate, endDate } = getDateRange(view as TCalendarView, dateValue);

	const [sections, setSections] = useState<ISection[]>([]);
	const [totalEvents, setTotalEvents] = useState<number>(0);

	const [isLoading, setLoading] = useState(true);
	const [isRefreshed, setRefreshed] = useState(false);

	const workerRef = useRef<Worker | null>(null);
	const [roomId, setRoomId] = useState<string>("-1");
	const [statusId, setStatusId] = useState<string>("1");

	const { data: events } = useEventsByStatusQuery(startDate, endDate, statusId);

	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		//The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
		//nextjs cache's the route so this is my temporary fix
		setRefreshed(true);
	}, []);

	useEffect(() => {
		setLoading(true);
	}, [dateValue, statusId, view]);

	useEffect(() => {
		//This is mostly as an example for myself, technically this processing should likely be done on the server side.
		//But this example will come in handy for other applications

		if (workerRef.current) {
			return;
		}

		const newWorker = new Worker(new URL("@/app/features/bookings/workers/booking-request-webworker.ts", import.meta.url));

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

	return (
		<>
			<RequestHeader
				view={view as TCalendarView}
				selectedDate={dateValue}
				roomId={roomId}
				statusId={statusId}
				isHeaderLoading={isLoading}
				totalEvents={totalEvents}
				OnRoomChange={value => {
					setRoomId(value);
				}}
				OnStatusChange={value => {
					setStatusId(value);
				}}
			/>
			<div className="flex h-[calc(100vh-180px)]">
				{isLoading && <SkeletonBookingList />}
				<BookingProvider
					value={{
						startDate: formatISO(startDate),
						endDate: formatISO(endDate),
						type: "status",
						id: "1",
					}}
				>
					{!isLoading && view !== "all" && <BookingList sections={sections} />}
					{!isLoading && view === "all" && (
						<BookingListByRoom
							sections={sections}
							page={currentPage}
						></BookingListByRoom>
					)}
				</BookingProvider>
				<div className="hidden w-74 divide-y border-l md:block">
					{view === "month" && <CalendarMonthPicker selectedDate={dateValue}></CalendarMonthPicker>}
					{view === "year" && <CalendarYearPicker selectedDate={dateValue}></CalendarYearPicker>}
					{view === "day" && <CalendarDayPicker selectedDate={dateValue}></CalendarDayPicker>}
					{view === "all" && (
						<PageList
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							sections={sections}
						></PageList>
					)}
				</div>
			</div>
		</>
	);
}

function PageList({
  sections,
  currentPage,
  onPageChange,
}: {
  sections: ISection[];
  currentPage: number;
  onPageChange: (value: number) => void;
}) {
  const PAGE_SIZE = 100;
  const totalPages = Math.ceil(sections.length / PAGE_SIZE);

  const getPageInfo = (page: number) => {
    const start = (page - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, sections.length);
    const firstDate = sections[start]?.formattedDate || "";
    const lastDate = sections[end - 1]?.formattedDate || "";
    const count = end - start;
    return { range: `${firstDate} - ${lastDate}`, count };
  };

  return (
    <>
      {totalPages > 1 && (
        <ScrollArea className="max-h-[calc(100vh-180px)] ">
          <div className="flex flex-wrap gap-2 p-4 justify-center border-t">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const { range, count } = getPageInfo(page);
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded ${currentPage === page ? "bg-primary text-white" : "bg-gray-200"}`}
                >
                  <div className="text-sm font-semibold">
                    Page {page} ({count} sections)
                  </div>
                  <div className="text-xs ">{range}</div>
                </button>
              );
            })}
          </div>
          <ScrollBar forceMount={true} orientation="vertical" />
        </ScrollArea>
      )}
    </>
  );
}
//295x360  - 224x260 mt-16 mx-26

//295x348
/*
<DayPicker
            className="mx-auto w-fit"
            mode="single"
            selected={new Date()}
            onSelect={() => {}}
            month={new Date()}
            onMonthChange={() => {}}
            fixedWeeks={true}
            required
            onToday={() => {}}
            view={"year"}
            startMonth={addYears(new Date(), -25)}
            endMonth={addYears(new Date(), 25)}
          />

          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-1 px-4 pt-4">
              <Skeleton className="w-full h-4"></Skeleton>
            </div>
            <div className="flex items-start gap-1 px-4 ">
              <Skeleton className="w-full h-4"></Skeleton>
            </div>
            <div className="flex items-start gap-1 px-4 ">
              <Skeleton className="w-full h-4"></Skeleton>
            </div>
          </div>
        </div>
*/
