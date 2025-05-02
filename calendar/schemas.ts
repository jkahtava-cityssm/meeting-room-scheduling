import { z } from "zod";

export const eventSchema = z
  .object({
    room: z.string(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    startDate: z.date({ required_error: "Start date is required" }),
    startTime: z.date({ required_error: "Start time is required" }),
    //startTime: z.object({ hour: z.number(), minute: z.number() }, { required_error: "Start time is required" }),
    endDate: z.date({ required_error: "End date is required" }),
    endTime: z.date({ required_error: "End time is required" }),
    duration: z.string(),
    //endTime: z.object({ hour: z.number(), minute: z.number() }, { required_error: "End time is required" }),
    color: z.string().min(1, "Color is required"),
  })

  .superRefine((data, ctx) => {
    const EndDate = new Date(data.endDate.toDateString());
    const StartDate = new Date(data.startDate.toDateString());

    const EndDateTime = new Date(data.endDate.setHours(data.endTime.getHours(), data.endTime.getMinutes()));
    const StartDateTime = new Date(data.startDate.setHours(data.startTime.getHours(), data.startTime.getMinutes()));

    const EndTime = new Date(data.startDate.setHours(data.endTime.getHours(), data.endTime.getMinutes()));
    const StartTime = new Date(data.startDate.setHours(data.startTime.getHours(), data.startTime.getMinutes()));

    if (EndDate < StartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start Date occurs after End Date",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End Date occurs before Start Date",
      });
      /*ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Start Time occurs after End Time",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End Time occurs before Start Time",
      });*/
    }

    if (EndTime < StartTime && EndDate === StartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Start Time occurs after End Time",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End Time occurs before Start Time",
      });
    }
  });

export type TEventFormData = z.infer<typeof eventSchema>;
