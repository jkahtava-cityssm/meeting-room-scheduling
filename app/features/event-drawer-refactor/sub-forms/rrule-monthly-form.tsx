// components/sub-forms/monthly-form.tsx
import { useWatch, Control } from "react-hook-form";
import { z } from "zod/v4";

import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { step2Schema } from "../event-drawer-schema.validator";
import { NumberFormInput } from "../components/number-form-input";
import { PeriodFormSelection } from "../components/period-form-select";
import { WeekDayFormSelection } from "../components/weekday-form-select";
// ... imports for UI components

export function MonthlyForm({
  control,
  isReadOnly,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
}) {
  // Watch values locally to this component
  const [pattern, periodValue] = useWatch({
    control,
    name: ["monthlyPattern", "monthPeriodValue"],
  });

  const isDayMode = pattern === "dayInMonth";
  const isPatternMode = pattern === "patternInMonth";

  return (
    <FormField
      control={control}
      name="monthlyPattern"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              disabled={isReadOnly}
              className="flex flex-col"
            >
              {/* Option 1: Day X of every Y months */}
              <MonthlyDayRow control={control} isActive={isDayMode} isReadOnly={isReadOnly} />

              {/* Option 2: The [First] [Monday] of every Y months */}
              <MonthlyPatternRow
                control={control}
                isActive={isPatternMode}
                monthPeriodValue={periodValue}
                isReadOnly={isReadOnly}
              />
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
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
  const disabled = !isActive || isReadOnly;

  return (
    <FormItem className="flex items-center gap-3">
      <FormControl className="mx-5.5">
        <RadioGroupItem value="dayInMonth" />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel>Day</FormLabel>
        <NumberFormInput control={control} name="monthDayValue" disabled={disabled} />
        <FormLabel className="min-w-14">of every</FormLabel>
        <NumberFormInput control={control} name="monthValue" disabled={disabled} showError={isActive} />
        <FormLabel>month(s)</FormLabel>
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
  const disabled = !isActive || isReadOnly;

  // Hide specific day types (Day, Weekday, Weekend) unless First or Last is chosen
  const showSpecificDays = monthPeriodValue === "1" || monthPeriodValue === "-1";

  return (
    <FormItem className="flex items-center gap-3">
      <FormControl className="mx-5.5">
        <RadioGroupItem value="patternInMonth" />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel>On the</FormLabel>
        <PeriodFormSelection control={control} name="monthPeriodValue" disabled={disabled} />
        <WeekDayFormSelection
          control={control}
          name="monthWeekdayValue"
          disabled={disabled}
          hideDayWeekday={!showSpecificDays}
        />
        <FormLabel className="min-w-14">of every</FormLabel>
        <NumberFormInput control={control} name="monthValue" disabled={disabled} showError={isActive} />
        <FormLabel>month(s)</FormLabel>
      </div>
    </FormItem>
  );
}
