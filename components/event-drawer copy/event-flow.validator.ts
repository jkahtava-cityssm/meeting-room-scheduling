import { SEvent } from "@/lib/schemas/calendar";
import { addMinutes, format, set } from "date-fns";
import { z, ZodObject, ZodRawShape } from "zod/v4";
import { getDurationText } from "./step1";

/*export const step1Schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  firstName: z.string().min(3, "First name must be at least 3 characters"),
  lastName: z.string().min(3, "Last name must be at least 3 characters"),
});*/

export const step2Schema = z.object({
  rule: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  repeatingType: z.string(),
  dailyPattern: z.string(),
  monthlyPattern: z.string(),
  yearlyPattern: z.string(),

  dayValue: z.string(),
  monthValue: z.string(),
  monthDayValue: z.string(),
  monthPeriodValue: z.string(),
  monthWeekdayValue: z.string(),
  yearValue: z.string(),
  yearDayValue: z.string(),
  yearMonthValue: z.string(),
  yearPeriodValue: z.string(),
  yearWeekdayValue: z.string(),

  weekValue: z.string(),
  weekdays: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),

  durationType: z.string(),
  occurrences: z.string(),
  lastOccurrenceDate: z.coerce.date() as unknown as z.ZodDate,
  duration: z.string().optional(),
});

export const step1Schema = z
  .object({
    eventId: z.string().optional(),
    roomId: z.string().refine(
      (value) => {
        return value !== "" && !isNaN(Number(value)) && Number(value) > 0;
      },
      {
        message: "Please select a Room",
      }
    ),
    memberId: z.string(),
    description: z.string().optional(),
    title: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
    recurrenceId: z.string().optional(),
    duration: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    isRecurring: z.string(),
  })
  .check((ctx) => {
    const EndDate = new Date(ctx.value.endDate);
    const StartDate = new Date(ctx.value.startDate);

    const EndDateTime = new Date(ctx.value.endTime);
    const StartDateTime = new Date(ctx.value.startTime);

    const EndTime = new Date(
      new Date(ctx.value.startDate).setHours(EndDateTime.getHours(), EndDateTime.getMinutes())
    ).getTime();
    const StartTime = new Date(
      new Date(ctx.value.startDate).setHours(StartDateTime.getHours(), StartDateTime.getMinutes())
    ).getTime();

    if (EndDate < StartDate) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startDate"],
        message: "Start Date exceeds End Date",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endDate"],
        message: "End Date precedes Start Date",
      });
    }

    if (EndTime < StartTime && EndDate.getTime() === StartDate.getTime()) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startDate"],
        message: "Start Time exceeds End Time",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startTime"],
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endDate"],
        message: "End Time precedes Start Time",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endTime"],
      });
    }
  });

export const defaultValues = (): object => {
  const startDateTime = format(new Date(), "yyyy-MM-dd hh:mm");
  const endDateTime = format(addMinutes(new Date(), 30), "yyyy-MM-dd hh:mm");

  const SEventFormDefaults = {
    eventId: "0",
    roomId: "",
    memberId: "",
    title: "",
    description: "",
    startDate: format(startDateTime, "yyyy-MM-dd"),
    startTime: format(startDateTime, "yyyy-MM-dd hh:mm"),
    endDate: format(endDateTime, "yyyy-MM-dd"),
    endTime: format(endDateTime, "yyyy-MM-dd hh:mm"),
    duration: getDurationText(startDateTime, startDateTime, endDateTime, endDateTime),
    isRecurring: "false",
    recurrenceId: "",
  };

  const SRecurrenceDefaults = {
    rule: "",
    startDate: format(startDateTime, "yyyy-MM-dd"),
    endDate: "",
    repeatingType: "",
    dailyPattern: "",
    monthlyPattern: "",
    yearlyPattern: "",

    dayValue: "",
    monthValue: "",
    monthDayValue: "",
    monthPeriodValue: "",
    monthWeekdayValue: "",
    yearValue: "",
    yearDayValue: "",
    yearMonthValue: "",
    yearPeriodValue: "",
    yearWeekdayValue: "",

    weekValue: "",
    weekdays: [],

    durationType: "",
    occurrences: "",
    lastOccurrenceDate: "",
  };

  return { ...SEventFormDefaults, ...SRecurrenceDefaults };
};

export const CombinedCheckoutSchema = step1Schema.extend(step2Schema.shape);

export type CombinedCheckoutType = z.infer<typeof CombinedCheckoutSchema>;
