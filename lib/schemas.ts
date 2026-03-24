import { z } from "zod/v4";

export const utcDateSchema = z.coerce.date().transform((d) => {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
    ),
  );
});

const DateSchema = z.union([z.string(), z.date().transform((d) => d.toISOString())]);

export const SProperty = z.object({
  propertyId: z.number(),
  name: z.string(),
  type: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const SItem = z.object({
  itemId: z.number(),
  name: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const SRoomRoles = z.object({
  roomRoleId: z.number(),
  roleId: z.number(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const SRoomCategory = z.object({
  roomCategoryId: z.number(),
  name: z.string().min(1, "Name is required"),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const SRoomProperty = z.object({
  roomPropertyId: z.number(),
  propertyId: z.number(),
  name: z.string(),
  value: z.string(),
  type: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const SRoom = z.object({
  roomId: z.number(),
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().nullable(),
  publicFacing: z.union([z.boolean(), z.stringbool()]).default(false),
  displayOrder: z.number().nullable(),
  roomCategoryId: z.number(),
  roomCategory: SRoomCategory,
  roomRoles: z.array(SRoomRoles).optional(),
  roomProperty: z.array(SRoomProperty).optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const SRecurrence = z.object({
  recurrenceId: z.number(),
  recurrenceCancellationId: z.number().nullable(),
  recurrenceExceptionId: z.number().nullable(),
  rule: z.string(),
  startDate: DateSchema,
  endDate: DateSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const SEventItem = z.object({
  eventItemId: z.number(),
  itemId: z.number(),
  name: z.string(),
});

export const SEventRecipient = z.object({
  eventRecipientId: z.number(),
  userId: z.number(),
});

export const SUser = z.object({
  userId: z.number(),
  name: z.string(),
  email: z.string(),
  department: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  employeeNumber: z.string().optional().nullable(),
  employeeActive: z.union([z.boolean(), z.stringbool()]),
});

export const SMultiDay = z.object({
  position: z.enum(["first", "last", "middle", "single"]),
  calculatedDate: z.string(),
});

export const SStatus = z.object({
  statusId: z.number(),
  key: z.string(),
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
  eventItems: z.array(SEventItem).optional(),
  eventRecipients: z.array(SEventRecipient).optional(),
  startDate: DateSchema,
  endDate: DateSchema,
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  parentEventId: z.number().nullable().optional(),
  room: SRoom,
  status: SStatus,
  recurrence: SRecurrence.nullish(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  multiDay: SMultiDay.optional(),
});

export type IStatus = z.infer<typeof SStatus>;

export type IEvent = z.infer<typeof SEvent>;
export type IRecurrence = z.infer<typeof SRecurrence>;
export type IRoom = z.infer<typeof SRoom>;

export type IUser = z.infer<typeof SUser>;
