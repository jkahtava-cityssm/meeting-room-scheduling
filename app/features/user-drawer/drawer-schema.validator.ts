import { z } from "zod/v4";

export const step1Schema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, "A User Name is required"),
  email: z.string().optional(),
  emailEnabled: z.string(),
  department: z.string(),
  jobTitle: z.string(),
  externalId: z.string().optional(),
  isActive: z.string(),
  isManaged: z.string(),
});

export const CombinedUserSchema = step1Schema;

export type CombinedSchema = z.infer<typeof CombinedUserSchema>;
