import { z } from "zod";

export const step1Schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  firstName: z.string().min(3, "First name must be at least 3 characters"),
  lastName: z.string().min(3, "Last name must be at least 3 characters"),
});
export const step2Schema = z.object({
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must be less than 100 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  /* ... more fields ... */
});

export const CombinedCheckoutSchema = step1Schema.merge(step2Schema);

export type CombinedCheckoutType = z.infer<typeof CombinedCheckoutSchema>;
