import { UseFormReturn } from "react-hook-form";
import { CombinedSchema } from "../room-drawer-schema.validator";
import { FormStep } from "../types";
import { getFieldValuesArray, getRRuleData } from "./rrule-preview-helper";

export const isStepValid = async (
  formStep: FormStep,
  methods: UseFormReturn<CombinedSchema>,
): Promise<{ status: boolean; errorList: string[] }> => {
  const formValues = methods.getValues();

  if (formStep.validationSchema) {
    const validationResult = formStep.validationSchema.safeParse(formValues);
    const errorList: string[] = [];

    if (!validationResult.success) {
      validationResult.error.issues.forEach((err) => {
        methods.setError(err.path.join(".") as keyof CombinedSchema, {
          type: "manual",
          message: err.message,
        });

        errorList.push(err.message);
      });
      return { status: false, errorList: errorList };
    }
  }

  return { status: true, errorList: [] };
};

export const isFormValid = async (
  formSteps: FormStep[],
  methods: UseFormReturn<CombinedSchema>,
  skipSteps: number[] = [],
): Promise<{ status: boolean; errorList: string[] }> => {
  let isValid = true;
  const totalErrorList = new Set<string>(); // Use a Set to auto-deduplicate

  for (let step = 0; step < formSteps.length; step++) {
    if (skipSteps.includes(step)) continue;

    const stepValid = await isStepValid(formSteps[step], methods);
    if (!stepValid.status) {
      isValid = false;
      stepValid.errorList.forEach((msg) => totalErrorList.add(msg));
    }
  }

  return { status: isValid, errorList: Array.from(totalErrorList) };
};

export const reconcileRecurringEventDates = async (formData: CombinedSchema): Promise<CombinedSchema | null> => {
  const needsRRuleUpdate = formData.isRecurring === "true" && formData.startDate !== formData.ruleStartDate;

  if (!needsRRuleUpdate) {
    return formData;
  }

  const rruleData = await getRRuleData({
    startDate: formData.startDate,
    values: getFieldValuesArray(formData),
  });

  if (!rruleData.ruleString || !rruleData.lastDate || !rruleData.firstDate) {
    return null;
  }

  const tempStartDate = new Date(rruleData.firstDate);
  const tempEndDate = new Date(formData.endDate);
  tempEndDate.setUTCFullYear(tempStartDate.getUTCFullYear());
  tempEndDate.setUTCMonth(tempStartDate.getUTCMonth());
  tempEndDate.setUTCDate(tempStartDate.getUTCDate());

  return {
    ...formData,
    //The event StartDate should always match the first recurrence
    startDate: rruleData.firstDate,
    endDate: tempEndDate.toISOString(),
    rule: rruleData.ruleString,
    ruleEndDate: rruleData.lastDate,
    ruleStartDate: rruleData.firstDate,
  };
};

function computeMinuteStepData(interval: number) {
  const stepValues: number[] = [];
  stepValues.push(-interval);
  const count = Math.floor(60 / interval);
  for (let i = 0; i < count; i++) {
    stepValues.push(i * interval);
  }
  stepValues.push(60);

  return {
    stepValues,
    wrapForward: { value: 60, substitute: interval },
    wrapBackward: { value: -interval, substitute: 60 - interval },
  };
}

export function getValidMinuteAndRolledHour(date: Date, interval?: number): Date {
  const allowed = [5, 10, 15, 20, 30, 60];
  const validatedInterval = typeof interval === "number" && allowed.includes(interval) ? interval : 15;

  const MINUTE_STEP_DATA = computeMinuteStepData(validatedInterval);

  const minute = date.getMinutes();
  const hour = date.getHours();

  const closest = MINUTE_STEP_DATA.stepValues.reduce((prev, curr) =>
    Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev,
  );

  const normalizedMinute = normalizeMinuteValue(closest, MINUTE_STEP_DATA);

  const newDate = new Date(date);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);

  if (normalizedMinute === 60) {
    newDate.setHours(hour + 1);
    newDate.setMinutes(0);
  } else {
    newDate.setMinutes(normalizedMinute);
  }

  return newDate;
}

function normalizeMinuteValue(
  value: number,
  MINUTE_STEP_DATA: {
    wrapForward: { value: number; substitute: number };
    wrapBackward: { value: number; substitute: number };
  },
): number {
  if (value === MINUTE_STEP_DATA.wrapForward.value) return MINUTE_STEP_DATA.wrapForward.substitute;
  if (value === MINUTE_STEP_DATA.wrapBackward.value) return MINUTE_STEP_DATA.wrapBackward.substitute;
  return value;
}
