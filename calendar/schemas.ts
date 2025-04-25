import { z } from "zod";

export const eventSchema = z.object({
  room: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  startTime: z.date({ required_error: "Start time is required" }),
  //startTime: z.object({ hour: z.number(), minute: z.number() }, { required_error: "Start time is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  endTime: z.date({ required_error: "End time is required" }),
  //endTime: z.object({ hour: z.number(), minute: z.number() }, { required_error: "End time is required" }),
  color: z.string().min(1, "Color is required"),
});

export type TEventFormData = z.infer<typeof eventSchema>;
