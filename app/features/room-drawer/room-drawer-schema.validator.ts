import { z } from "zod/v4";

export const step1Schema = z.object({
  roomId: z.string().optional(),
  name: z.string().min(1, "A Room Name is required"),
  color: z.string().min(1, "Please select a Color"),
  icon: z.string().min(1, "Please select a Icon"),
  publicFacing: z.string(),
  roomCategoryId: z.string().refine((v) => v !== "" && !isNaN(Number(v)) && Number(v) > 0, "Please select a Category"),
  roomRoles: z.array(z.string()),
  roomProperty: z.array(z.string()),
});

export const CombinedRoomSchema = step1Schema;

export type CombinedSchema = z.infer<typeof CombinedRoomSchema>;
