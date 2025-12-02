import { useState } from "react";
import { DayPicker } from "../ui/day-picker";
import { useRouter } from "next/navigation";
import { navigateURL } from "@/lib/helpers";
import { addYears } from "date-fns";

export function CalendarDayPicker({ selectedDate }: { selectedDate: Date }) {
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate);
  const { push } = useRouter();

  const handleNavigate = (date: Date) => {
    push(navigateURL(date, "day"));
  };

  return (
    <DayPicker
      className="mx-auto w-fit"
      mode="single"
      selected={currentDate}
      onSelect={handleNavigate}
      month={currentDate}
      onMonthChange={setCurrentDate}
      fixedWeeks={true}
      required
      onToday={() => setCurrentDate(new Date())}
      startMonth={addYears(currentDate, -25)}
      endMonth={addYears(currentDate, 25)}
    />
  );
}
