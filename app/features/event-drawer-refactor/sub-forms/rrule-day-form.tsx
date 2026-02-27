import { Control } from "react-hook-form";
import { z } from "zod/v4";

import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

import { step2Schema } from "../event-drawer-schema.validator";
import { NumberFormInput } from "../components/number-form-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function DailyForm({
  control,
  isReadOnly,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
}) {
  return (
    <FormField
      control={control}
      name="dailyPattern"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value} // Controlled value
              disabled={isReadOnly}
              className="flex flex-col gap-4"
            >
              {/* Option 1: Every X days */}
              <DailyIntervalRow control={control} isActive={field.value === "daily"} isReadOnly={isReadOnly} />

              <DailyWeekdayRow isReadOnly={isReadOnly} />
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function DailyIntervalRow({
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
        <RadioGroupItem value="daily" />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel>Every</FormLabel>
        <NumberFormInput control={control} name="dayValue" disabled={disabled} />
        <FormLabel>Days</FormLabel>
      </div>
    </FormItem>
  );
}

function DailyWeekdayRow({ isReadOnly }: { isReadOnly: boolean }) {
  return (
    <FormItem className="flex items-center gap-3">
      <FormControl className="mx-5.5">
        <RadioGroupItem value="weekdays" />
      </FormControl>
      <FormLabel className="font-normal cursor-pointer">Every Weekday (Mon, Tue, Wed, Thu, Fri)</FormLabel>
    </FormItem>
  );
}
