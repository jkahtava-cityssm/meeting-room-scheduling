import { useWatch, Control } from "react-hook-form";
import { z } from "zod/v4";

import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

import { step2Schema } from "../event-drawer-schema.validator";
import { NumberFormInput } from "../components/number-form-input";
import { PeriodFormSelection } from "../components/period-form-select";
import { WeekDayFormSelection } from "../components/weekday-form-select";
import { MonthFormSelection } from "../components/month-form-select";
import { ErrorMessage } from "../components/error-message";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function YearlyForm({
  control,
  isReadOnly,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
}) {
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
          <FormField
            control={control}
            name="yearlyPattern"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col "
                    disabled={isReadOnly}
                  >
                    {/* Option 1: Day X of every Y months */}
                    <YearlyDayRow
                      control={control}
                      isActive={field.value === "dayInMonthInYear"}
                      isReadOnly={isReadOnly}
                    />
                    {/* Option 2: The [First] [Monday] of every Y months     */}
                    <YearlyPatternRow
                      control={control}
                      isActive={field.value === "patternInMonthInYear"}
                      isReadOnly={isReadOnly}
                      yearPeriodValue={yearPeriodValue}
                    />
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          {/*[
            "ruleEndDate",
            "yearValue",
            "yearlyPattern",
            "yearDayValue",
            "yearPeriodValue",
            "yearWeekdayValue",
            "yearMonthValue",
          ].map((field) => (
            
<ErrorMessage
              key={field}
              control={control}
              fieldName={
                field as
                  | "ruleEndDate"
                  | "yearValue"
                  | "yearlyPattern"
                  | "yearDayValue"
                  | "yearPeriodValue"
                  | "yearWeekdayValue"
                  | "yearMonthValue"
              }
      }
            
            />
          ))*/}
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
  const disabled = !isActive || isReadOnly;

  return (
    <FormItem className="flex items-center gap-3">
      <FormControl className="mx-5.5">
        <RadioGroupItem value="dayInMonthInYear" />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel>On</FormLabel>
        <MonthFormSelection control={control} name="yearMonthValue" disabled={disabled} showError={isActive} />
        <NumberFormInput control={control} name="yearDayValue" disabled={disabled} />
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
  const disabled = !isActive || isReadOnly;
  const showSpecificDays = yearPeriodValue === "1" || yearPeriodValue === "-1";

  return (
    <FormItem className="flex items-center gap-3">
      <FormControl className="mx-5.5">
        <RadioGroupItem value="patternInMonthInYear" />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel>On the</FormLabel>
        <PeriodFormSelection control={control} name="yearPeriodValue" disabled={disabled} />
        <WeekDayFormSelection
          control={control}
          name="yearWeekdayValue"
          disabled={disabled}
          hideDayWeekday={!showSpecificDays}
        />
        <FormLabel>of</FormLabel>
        <MonthFormSelection control={control} name="yearMonthValue" disabled={disabled} showError={isActive} />
      </div>
    </FormItem>
  );
}
