import { SEvent } from "@/lib/schemas/calendar";
import { format, set } from "date-fns";
import { z } from "zod/v4";

/*export const step1Schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  firstName: z.string().min(3, "First name must be at least 3 characters"),
  lastName: z.string().min(3, "Last name must be at least 3 characters"),
});*/
export const step2Schema = z.object({
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must be less than 100 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  /* ... more fields ... */
});

export const step1Schema = z
  .object({
    eventId: z.string().optional(),
    roomId: z.string(),
    description: z.string().optional(),
    title: z.string(),
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

    const EndTime = new Date(StartDate.setHours(EndDateTime.getHours(), EndDateTime.getMinutes())).getTime();
    const StartTime = new Date(StartDate.setHours(StartDateTime.getHours(), StartDateTime.getMinutes())).getTime();

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

export const CombinedCheckoutSchema = step1Schema.extend(step2Schema.shape);

export type CombinedCheckoutType = z.infer<typeof CombinedCheckoutSchema>;
