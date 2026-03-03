// components/sub-forms/monthly-form.tsx
import { useWatch, Control, useFormContext } from "react-hook-form";
import { z } from "zod/v4";

import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

import { step2Schema } from "../room-drawer-schema.validator";
import { NumberFormInput } from "../components/number-form-input";
import { PeriodFormSelection } from "../components/period-form-select";
import { WeekDayFormSelection } from "../components/weekday-form-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// ... imports for UI components

export function MonthlyForm({
  control,
  isReadOnly,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
}) {
  // Watch values locally to this component
  const { setValue } = useFormContext();
  const [pattern, periodValue] = useWatch({
    control,
    name: ["monthlyPattern", "monthPeriodValue"],
  });

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        onValueChange={(val) => setValue("monthlyPattern", val, { shouldValidate: true })}
        value={pattern}
        disabled={isReadOnly}
        className="flex flex-col"
        data-error={false}
      >
        <MonthlyDayRow control={control} isActive={pattern === "dayInMonth"} isReadOnly={isReadOnly} />

        <MonthlyPatternRow
          control={control}
          isActive={pattern === "patternInMonth"}
          monthPeriodValue={periodValue}
          isReadOnly={isReadOnly}
        />
      </RadioGroup>
    </div>
  );
}

function MonthlyDayRow({
  control,
  isReadOnly,
  isActive,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
  isActive: boolean;
}) {
  const {
    formState: { errors },
  } = useFormContext();
  const disabled = !isActive || isReadOnly;

  // Logic: Red if (this row is active AND monthDayValue is wrong) OR monthValue is wrong

  const hasErrorInRow = isActive && !!(errors.monthDayValue || errors.monthValue);
  return (
    <FormItem className="flex items-center gap-3 space-y-0" data-error={hasErrorInRow}>
      <FormControl className="mx-5.5">
        <RadioGroupItem value="dayInMonth" data-error={hasErrorInRow} />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel data-error={hasErrorInRow}>Day</FormLabel>
        <NumberFormInput control={control} name="monthDayValue" disabled={disabled} showError={isActive} />

        <FormLabel data-error={hasErrorInRow} className="min-w-14">
          of every
        </FormLabel>
        <NumberFormInput control={control} name="monthValue" disabled={isReadOnly} showError={isActive} />
        <FormLabel data-error={hasErrorInRow}>month(s)</FormLabel>
      </div>
    </FormItem>
  );
}

function MonthlyPatternRow({
  control,
  isReadOnly,
  isActive,
  monthPeriodValue,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
  isActive: boolean;
  monthPeriodValue: string | undefined;
}) {
  const {
    formState: { errors },
  } = useFormContext();
  const disabled = !isActive || isReadOnly;
  const showSpecificDays = monthPeriodValue === "1" || monthPeriodValue === "-1";

  const hasErrorInRow = isActive && !!(errors.monthWeekdayValue || errors.monthValue || errors.monthPeriodValue);

  return (
    <FormItem className="flex items-center gap-3 space-y-0" data-error={hasErrorInRow}>
      <FormControl className="mx-5.5">
        <RadioGroupItem value="patternInMonth" data-error={hasErrorInRow} />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel data-error={hasErrorInRow}>On the</FormLabel>
        <PeriodFormSelection control={control} name="monthPeriodValue" disabled={disabled} showError={isActive} />
        <WeekDayFormSelection
          control={control}
          name="monthWeekdayValue"
          disabled={disabled}
          hideDayWeekday={!showSpecificDays}
          showError={isActive}
        />

        <FormLabel data-error={hasErrorInRow} className="min-w-14">
          of every
        </FormLabel>
        <NumberFormInput control={control} name="monthValue" disabled={isReadOnly} showError={isActive} />
        <FormLabel data-error={hasErrorInRow}>month(s)</FormLabel>
      </div>
    </FormItem>
  );
}
