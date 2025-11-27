import { UseFormReturn } from "react-hook-form";
import { CombinedSchema } from "./event-drawer.validator";
import { FormStep } from "./types";
import { getFieldValuesArray, getRRuleData } from "./rrule-preview-helper";

export const isStepValid = async (formStep: FormStep, methods: UseFormReturn<CombinedSchema>): Promise<boolean> => {
  const formValues = getFormValues(formStep, methods);

  if (formStep.validationSchema) {
    const validationResult = formStep.validationSchema.safeParse(formValues);

    if (!validationResult.success) {
      validationResult.error.issues.forEach((err) => {
        methods.setError(err.path.join(".") as keyof CombinedSchema, {
          type: "manual",
          message: err.message,
        });
      });
      return false;
    }
  }

  return true;
};

export const isFormValid = async (
  formSteps: FormStep[],
  methods: UseFormReturn<CombinedSchema>,
  skipSteps: number[] = []
): Promise<boolean> => {
  let isValid = true;
  for (let step = 0; step < formSteps.length; step++) {
    if (skipSteps.includes(step)) {
      continue;
    }

    const stepValid = await isStepValid(formSteps[step], methods);
    if (!stepValid) isValid = false;
  }
  return isValid;
};

export const getFormValues = <T>(formStep: FormStep, methods: UseFormReturn<CombinedSchema>): T => {
  const currentStepValues = methods.getValues(formStep.fields as (keyof CombinedSchema)[]);
  const formValues = Object.fromEntries(formStep.fields.map((field, index) => [field, currentStepValues[index] || ""]));

  return formValues as T;
};

export const updateRRuleIfNecessary = async (allData: CombinedSchema): Promise<CombinedSchema | null> => {
  const needsRRuleUpdate = allData.isRecurring === "true" && allData.startDate !== allData.ruleStartDate;

  if (!needsRRuleUpdate) {
    return allData;
  }

  const rruleData = await getRRuleData({
    startDate: allData.startDate,
    fieldValues: getFieldValuesArray(allData),
  });

  if (!rruleData.ruleString || !rruleData.lastDate) {
    return null;
  }

  return {
    ...allData,
    rule: rruleData.ruleString,
    ruleEndDate: rruleData.lastDate,
    ruleStartDate: allData.startDate,
  };
};

const MINUTE_STEP_DATA: {
  stepValues: number[];
  wrapForward: { value: number; substitute: number };
  wrapBackward: { value: number; substitute: number };
} = {
  stepValues: [-15, 0, 15, 30, 45, 60],
  wrapForward: { value: 60, substitute: 15 },
  wrapBackward: { value: -15, substitute: 45 },
};

export function getValidMinuteAndRolledHour(date: Date): Date {
  const minute = date.getMinutes();
  const hour = date.getHours();

  const closest = MINUTE_STEP_DATA.stepValues.reduce((prev, curr) =>
    Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev
  );

  const normalizedMinute = normalizeMinuteValue(closest);

  const newDate = new Date(date);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);

  // If rounding up to 60, roll over the hour
  if (normalizedMinute === 60) {
    newDate.setHours(hour + 1);
    newDate.setMinutes(0);
  } else {
    newDate.setMinutes(normalizedMinute);
  }

  return newDate;
}

function normalizeMinuteValue(value: number): number {
  if (value === MINUTE_STEP_DATA.wrapForward.value) return MINUTE_STEP_DATA.wrapForward.substitute;
  if (value === MINUTE_STEP_DATA.wrapBackward.value) return MINUTE_STEP_DATA.wrapBackward.substitute;
  return value;
}
