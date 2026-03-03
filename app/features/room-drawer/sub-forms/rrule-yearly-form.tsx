import { useWatch, Control, useFormContext } from "react-hook-form";
import { z } from "zod/v4";

import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

import { step2Schema } from "../room-drawer-schema.validator";
import { NumberFormInput } from "../components/number-form-input";
import { PeriodFormSelection } from "../components/period-form-select";
import { WeekDayFormSelection } from "../components/weekday-form-select";
import { MonthFormSelection } from "../components/month-form-select";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function YearlyForm({
  control,
  isReadOnly,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
}) {
  const { setValue } = useFormContext();
  const [pattern, yearPeriodValue] = useWatch({
    control,
    name: ["yearlyPattern", "yearPeriodValue"],
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <FormLabel className="min-w-15  justify-end">Every</FormLabel>
          <NumberFormInput control={control} name={"yearValue"} disabled={isReadOnly} />
          <FormLabel>Year(s)</FormLabel>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <RadioGroup
            onValueChange={(val) => setValue("yearlyPattern", val, { shouldValidate: true })}
            value={pattern}
            className="flex flex-col "
            disabled={isReadOnly}
            data-error={false}
          >
            {/* Option 1: Day X of every Y months */}
            <YearlyDayRow control={control} isActive={pattern === "dayInMonthInYear"} isReadOnly={isReadOnly} />
            {/* Option 2: The [First] [Monday] of every Y months     */}
            <YearlyPatternRow
              control={control}
              isActive={pattern === "patternInMonthInYear"}
              isReadOnly={isReadOnly}
              yearPeriodValue={yearPeriodValue}
            />
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}

function YearlyDayRow({
  control,
  isActive,
  isReadOnly,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isActive: boolean;
  isReadOnly: boolean;
}) {
  const {
    formState: { errors },
  } = useFormContext();

  const disabled = !isActive || isReadOnly;
  const hasErrorInRow = isActive && !!(errors.yearMonthValue || errors.yearDayValue);
  return (
    <FormItem className="flex items-center gap-3" data-error={hasErrorInRow}>
      <FormControl className="mx-5.5">
        <RadioGroupItem value="dayInMonthInYear" data-error={hasErrorInRow} />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel data-error={hasErrorInRow}>On</FormLabel>
        <MonthFormSelection control={control} name="yearMonthValue" disabled={disabled} showError={isActive} />
        <NumberFormInput control={control} name="yearDayValue" disabled={disabled} showError={isActive} />
      </div>
    </FormItem>
  );
}

function YearlyPatternRow({
  control,
  isActive,
  isReadOnly,
  yearPeriodValue,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isActive: boolean;
  isReadOnly: boolean;
  yearPeriodValue: string | undefined;
}) {
  const {
    formState: { errors },
  } = useFormContext();
  const disabled = !isActive || isReadOnly;
  const showSpecificDays = yearPeriodValue === "1" || yearPeriodValue === "-1";

  // Check all three fields relevant to this row
  const hasErrorInRow = isActive && !!(errors.yearPeriodValue || errors.yearWeekdayValue || errors.yearMonthValue);

  return (
    <FormItem className="flex items-center gap-3 space-y-0" data-error={hasErrorInRow}>
      <FormControl className="mx-5.5">
        <RadioGroupItem value="patternInMonthInYear" data-error={hasErrorInRow} />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel data-error={hasErrorInRow}>On the</FormLabel>
        <PeriodFormSelection control={control} name="yearPeriodValue" disabled={disabled} showError={isActive} />
        <WeekDayFormSelection
          control={control}
          name="yearWeekdayValue"
          disabled={disabled}
          hideDayWeekday={!showSpecificDays}
          showError={isActive}
        />
        <FormLabel data-error={hasErrorInRow}>of</FormLabel>
        <MonthFormSelection control={control} name="yearMonthValue" disabled={disabled} showError={isActive} />
      </div>
    </FormItem>
  );
}
