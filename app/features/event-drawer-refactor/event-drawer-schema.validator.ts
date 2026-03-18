import { z } from "zod/v4";

export const DURATION_OPTIONS = ["until", "forever", "count", ""] as const;

// 1. Define the Shared Fields (things every recurrence has)
export const BaseRecurrence = z.object({
	rule: z.string().min(1, "Please define a recurrence rule"),
	ruleStartDate: z.string(),
	ruleEndDate: z.string(),
	untilDate: z.string(),
	durationType: z.enum(DURATION_OPTIONS).refine(val => val !== "", {
		message: "Recurrence duration is missing ",
	}),
	occurrences: z.string(),
});

// 2. Define the Specific Patterns

const Daily = z
	.object({
		repeatingType: z.literal("daily"),
		dailyPattern: z.enum(["weekdays", "daily"]), // adjust to your actual values
		dayValue: z.string().optional(), // make it optional at the field level
	})
	.superRefine((data, ctx) => {
		// Require dayValue unless dailyPattern is "weekdays"
		if (data.dailyPattern !== "weekdays") {
			if (!data.dayValue || data.dayValue.trim() === "") {
				ctx.addIssue({
					code: "custom",
					path: ["dayValue"],
					message: "Indicate frequency in Days",
				});
			}
		}
	});

const Weekly = z.object({
	repeatingType: z.literal("weekly"),
	weekValue: z.string().min(1, "Indicate frequency in Weeks"),
	weekdays: z.array(z.string()).min(1, "Please select at least one weekday"),
});

const Monthly = z.object({
	repeatingType: z.literal("monthly"),
	monthlyPattern: z.enum(["dayInMonth", "patternInMonth"]),
	monthValue: z.string().min(1),
	monthDayValue: z.string().optional(),
	monthPeriodValue: z.string().optional(),
	monthWeekdayValue: z.string().optional(),
});

const Yearly = z.object({
	repeatingType: z.literal("yearly"),
	yearlyPattern: z.enum(["dayInMonthInYear", "patternInMonthInYear"]),
	yearValue: z.string().min(1),
	yearMonthValue: z.string().min(1, "Select a month"),
	yearDayValue: z.string().optional(),
	yearPeriodValue: z.string().optional(),
	yearWeekdayValue: z.string().optional(),
});

// 3. Combine them using Discriminated Union
export const step2Schema = z
	.intersection(BaseRecurrence, z.discriminatedUnion("repeatingType", [Daily, Weekly, Monthly, Yearly]))
	.superRefine((data, ctx) => {
		// --- Yearly Logic ---
		if (data.repeatingType === "yearly") {
			// Pattern 1: Day in Month (e.g., "On January 15")
			if (data.yearlyPattern === "dayInMonthInYear") {
				if (!data.yearDayValue || data.yearDayValue.trim() === "") {
					ctx.addIssue({
						code: "custom",
						path: ["yearDayValue"], // Label watches this path!
						message: "Pick a day",
					});
				}
			}

			// Pattern 2: Period in Month (e.g., "On the First Monday of January")
			if (data.yearlyPattern === "patternInMonthInYear") {
				if (!data.yearPeriodValue) {
					ctx.addIssue({
						code: "custom",
						path: ["yearPeriodValue"],
						message: "Select a period",
					});
				}
				if (!data.yearWeekdayValue) {
					ctx.addIssue({
						code: "custom",
						path: ["yearWeekdayValue"],
						message: "Select a weekday",
					});
				}
			}
		}

		// --- Monthly Logic ---
		if (data.repeatingType === "monthly") {
			if (data.monthlyPattern === "dayInMonth") {
				if (!data.monthDayValue) {
					ctx.addIssue({
						code: "custom",
						path: ["monthDayValue"],
						message: "Pick a day",
					});
				}
			}

			if (data.monthlyPattern === "patternInMonth") {
				if (!data.monthPeriodValue) ctx.addIssue({ code: "custom", path: ["monthPeriodValue"], message: "Select period" });
				if (!data.monthWeekdayValue) ctx.addIssue({ code: "custom", path: ["monthWeekdayValue"], message: "Select weekday" });
			}
		}
	});
// --- Step 1 Schema ---
export const getStep1Schema = (min: number, max: number) =>
	z
		.object({
			eventId: z.string().optional(),
			roomId: z.string().refine(v => v !== "" && !isNaN(Number(v)) && Number(v) > 0, "Please select a Room"),
			userId: z.string().refine(v => v !== "" && !isNaN(Number(v)) && Number(v) > 0, "Please select a Member"),
			eventRecipientIds: z.array(z.string()),
			description: z.string().optional(),
			title: z.string().min(1, "Title is required"),
			statusId: z.string().min(1, "Status is required"),
			startDate: z.string().min(1, "Start date is required"),
			endDate: z.string().min(1, "End date is required"),
			recurrenceId: z.string().optional(),
			eventItemIds: z.array(z.string()),
			duration: z.string().min(1, "Duration is required"),
			isRecurring: z.string(),
		})
		.superRefine((val, ctx) => {
			const start = new Date(val.startDate);
			const end = new Date(val.endDate);

			// Chronological check
			if (end < start) {
				ctx.addIssue({ code: "custom", path: ["startDate"], message: "Start Date exceeds End Date" });
			}

			// Dynamic Hour Check
			const startHour = start.getHours();
			if (startHour < min || startHour > max) {
				ctx.addIssue({
					code: "custom",
					path: ["startDate"],
					message: `Time must be between ${min}:00 and ${max}:00`,
				});
			}
		});

export type DurationType = z.infer<typeof BaseRecurrence>["durationType"];

export type Step1Schema = z.infer<ReturnType<typeof getStep1Schema>>;
export type Step2Schema = z.infer<typeof step2Schema>;

export const getCombinedSchema = (min: number, max: number) => getStep1Schema(min, max).and(step2Schema);

export type CombinedSchema = z.infer<ReturnType<typeof getCombinedSchema>>;

export const Step2Fields = BaseRecurrence.extend(Daily.shape).extend(Weekly.shape).extend(Monthly.shape).extend(Yearly.shape);

export type FlatCombinedSchema = z.infer<ReturnType<typeof getStep1Schema>> & z.infer<typeof Step2Fields>;
