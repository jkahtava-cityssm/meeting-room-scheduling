import { z } from "zod/v4";

export const SRoomScope = z.object({
  roomScopeId: z.number(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.string(),
  updatedAt: z.string(),
  accessLevel: z.number(),
});

export const SRoomCategory = z.object({
  roomCategoryId: z.number(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SRoomProperty = z.object({
  roomPropertyId: z.number(),
  roomId: z.number(),
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SRoom = z.object({
  roomId: z.number(),
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().nullable(),
  roomScopeId: z.number(),
  roomScope: SRoomScope,
  roomCategoryId: z.number(),
  roomCategory: SRoomCategory,
  RoomProperty: z.array(SRoomProperty).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SRecurrence = z.object({
  recurrenceId: z.number(),
  recurrenceCancellationId: z.number().nullable(),
  recurrenceExceptionId: z.number().nullable(),
  rule: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SUser = z.object({
  userId: z.number(),
  name: z.string(),
  email: z.string(),
});

export const SMultiDay = z.object({
  position: z.enum(["first", "last", "middle"]),
});

export const SStatus = z.object({
  statusId: z.number(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
});

export const SEvent = z.object({
  eventId: z.number(),
  roomId: z.number().gt(0, "Room is required"),
  userId: z.number().nullable().optional(),
  statusId: z.number(),
  recurrenceId: z.number().nullable(),
  startDate: z.coerce.string({
    error: (issue) => (issue.input === undefined ? "Start date is required" : "Not a valid Start Date"),
  }),
  //I hate this, but its the only way to fix the zodResolver
  //Others have similar issues see https://github.com/colinhacks/zod/issues/3537
  endDate: z.coerce.string({
    error: (issue) => (issue.input === undefined ? "End date is required" : "Not a valid End Date"),
  }),

  title: z.string().min(1, "Title is required"),
  description: z.string(),
  parentEventId: z.number().nullable().optional(),
  room: SRoom,
  status: SStatus,
  recurrence: SRecurrence.nullish(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
  multiDay: SMultiDay.optional(),
});

export type IStatus = z.infer<typeof SStatus>;

export type IEvent = z.infer<typeof SEvent>;
export type IRecurrence = z.infer<typeof SRecurrence>;
export type IRoom = z.infer<typeof SRoom>;
