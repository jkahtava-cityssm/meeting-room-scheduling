import { CalendarAllViews } from "@/components/calendar/calendar-all-views";

export default async function Calendar({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  //const params = await searchParams;
  //const dateParam = searchParams.get("selectedDate");
  //const viewParam = searchParams.get("view");
  //console.log(params);
  return (
    <div>
      <CalendarAllViews />
    </div>
  );
}
