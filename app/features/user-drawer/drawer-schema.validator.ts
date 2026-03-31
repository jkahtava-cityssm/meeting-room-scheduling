import { z } from "zod/v4";

export const step1Schema = z
  .object({
    userId: z.string().optional(),
    name: z.string().min(1, "A Name is required"),
    email: z.email({ error: "Invalid email address." }).or(z.literal("")).optional(),
    emailEnabled: z.string(),
    department: z.string(),
    jobTitle: z.string(),
    externalId: z.string().optional(),
    isActive: z.string(),
    isManaged: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.emailEnabled === "true" && (!data.email || data.email === "")) {
      ctx.addIssue({
        code: "custom",
        message: "Email is required when email is Allowed",
        path: ["email"],
      });
    }
  });

export const CombinedUserSchema = step1Schema;

export type CombinedSchema = z.infer<typeof CombinedUserSchema>;
