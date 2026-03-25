import { z } from "zod/v4";

export const step1Schema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, "A User Name is required"),
  email: z.string().optional(),
  employeeActive: z.string(),
  isExternal: z.string(),
  receiveEmail: z.string(),
  department: z.string(),
  jobTitle: z.string(),
  employeeNumber: z.string().optional(),
});

export const CombinedUserSchema = step1Schema;

export type CombinedSchema = z.infer<typeof CombinedUserSchema>;
