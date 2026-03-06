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

export const SProperty = z.object({
  propertyId: z.number(),
  name: z.string(),
  type: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const SRoomRoles = z.object({
  roomRoleId: z.number(),
  roleId: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const SRoomCategory = z.object({
  roomCategoryId: z.number(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const SRoomProperty = z.object({
  roomPropertyId: z.number(),
  propertyId: z.number(),
  name: z.string(),
  value: z.string(),
  type: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const SRoom = z.object({
  roomId: z.number(),
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().nullable(),
  publicFacing: z.union([z.boolean(), z.stringbool()]).default(false),
  roomCategoryId: z.number(),
  roomCategory: SRoomCategory,
  roomRoles: z.array(SRoomRoles).optional(),
  roomProperty: z.array(SRoomProperty).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const SRecurrence = z.object({
  recurrenceId: z.number(),
  recurrenceCancellationId: z.number().nullable(),
  recurrenceExceptionId: z.number().nullable(),
  rule: z.string(),
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
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
  position: z.enum(["first", "last", "middle"]),
});

export const SStatus = z.object({
  statusId: z.number(),
  key: z.string(),
  name: z.string(),
  icon: z.string().nullable().default("none"),
  color: z.string().nullable().default("none"),
});

export const SEvent = z.object({
  eventId: z.number(),
  roomId: z.number().gt(0, "Room is required"),
  userId: z.number().nullable().optional(),
  statusId: z.number(),
  recurrenceId: z.number().nullable(),
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  parentEventId: z.number().nullable().optional(),
  room: SRoom,
  status: SStatus.nullish(),
  recurrence: SRecurrence.nullish(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  multiDay: SMultiDay.optional(),
});

export type IStatus = z.infer<typeof SStatus>;

export type IEvent = z.infer<typeof SEvent>;
export type IRecurrence = z.infer<typeof SRecurrence>;
export type IRoom = z.infer<typeof SRoom>;
