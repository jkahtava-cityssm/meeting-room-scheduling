import { z } from "zod";

export const SRoom = z.object({
  roomId: z.number(),
  color: z.string().min(1, "Colour is required"),
  name: z.string().min(1, "Name is required"),
  createdAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  updatedAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  icon: z.string().nullable(),
});

export const SRecurrence = z.object({
  recurrenceId: z.number(),
  recurrenceCancellationId: z.number().nullable(),
  recurrenceExceptionId: z.number().nullable(),
  rule: z.string().min(1, "Rule is required"),
  startDate: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  endDate: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  createdAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
  updatedAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
});

export const SMultiDay = z.object({
  position: z.enum(["first", "last", "middle"]),
});

export const SEvent = z
  .object({
    eventId: z.number(),
    roomId: z.number(),
    recurrenceId: z.number().nullable(),
    startDate: z.coerce.date({ required_error: "Start date is required" }), //z.string().transform((value) => new Date(value)), //.date({ required_error: "Start date is required" }),
    endDate: z.coerce.date({ required_error: "End date is required" }), //z.string().transform((value) => new Date(value)),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    parentEventId: z.number().nullable().optional(),
    room: SRoom,
    recurrence: SRecurrence.nullish(),
    createdAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
    updatedAt: z.coerce.date(), //z.string().transform((value) => new Date(value)),
    multiDay: SMultiDay.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start Date or Time occurs after End Date or Time",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End Date or Time occurs before Start Date or Time",
      });
    }
  });

export type IEvent = z.infer<typeof SEvent>;
export type IRecurrence = z.infer<typeof SRecurrence>;
export type IRoom = z.infer<typeof SRoom>;
