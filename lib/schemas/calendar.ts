import { z } from "zod/v4";

//const coerceDate = z.coerce.date() as unknown as z.ZodDate

export const SRoom = z.object({
  roomId: z.number(),
  color: z.string().min(1, "Colour is required"),
  name: z.string().min(1, "Name is required"),
  createdAt: z.coerce.date() as unknown as z.ZodDate, //z.string().transform((value) => new Date(value)),
  updatedAt: z.coerce.date() as unknown as z.ZodDate, //z.string().transform((value) => new Date(value)),
  icon: z.string().nullable(),
});

export const SRecurrence = z.object({
  recurrenceId: z.number(),
  recurrenceCancellationId: z.number().nullable(),
  recurrenceExceptionId: z.number().nullable(),
  rule: z.string(),
  startDate: z.coerce.date() as unknown as z.ZodDate, //z.string().transform((value) => new Date(value)),
  endDate: z.coerce.date() as unknown as z.ZodDate, //z.string().transform((value) => new Date(value)),
  createdAt: z.coerce.date() as unknown as z.ZodDate, //z.string().transform((value) => new Date(value)),
  updatedAt: z.coerce.date() as unknown as z.ZodDate, //z.string().transform((value) => new Date(value)),
});

export const SMultiDay = z.object({
  position: z.enum(["first", "last", "middle"]),
});

export const SEvent = z.object({
  eventId: z.number(),
  roomId: z.number().gt(0, "Room is required"),
  recurrenceId: z.number().nullable(),
  startDate: z.coerce.date({
    error: (issue) => (issue.input === undefined ? "Start date is required" : "Not a valid Start Date"),
  }) as unknown as z.ZodDate,
  //I hate this, but its the only way to fix the zodResolver
  //Others have similar issues see https://github.com/colinhacks/zod/issues/3537
  endDate: z.coerce.date({
    error: (issue) => (issue.input === undefined ? "End date is required" : "Not a valid End Date"),
  }) as unknown as z.ZodDate,

  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  parentEventId: z.number().nullable().optional(),
  room: SRoom,
  recurrence: SRecurrence.nullish(),
  createdAt: z.coerce.date() as unknown as z.ZodDate,
  updatedAt: z.coerce.date() as unknown as z.ZodDate,
  multiDay: SMultiDay.optional(),
});

export type IEvent = z.infer<typeof SEvent>;
export type IRecurrence = z.infer<typeof SRecurrence>;
export type IRoom = z.infer<typeof SRoom>;
