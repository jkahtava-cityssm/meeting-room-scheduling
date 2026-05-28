import { Control, useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod/v4';

import { FormControl, FormItem, FormLabel } from '@/components/ui/form';

import { step2Schema } from '../drawer-schema.validator';
import { NumberFormInput } from '../components/number-form-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function DailyForm({ control, isReadOnly }: { control: Control<z.infer<typeof step2Schema>>; isReadOnly: boolean }) {
  const { setValue } = useFormContext();

  const pattern = useWatch({
    control,
    name: 'dailyPattern',
  });

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        onValueChange={(val) => setValue('dailyPattern', val, { shouldValidate: true })}
        value={pattern}
        disabled={isReadOnly}
        className="flex flex-col gap-4"
        data-error={false} // Neutralize parent error
      >
        {/* Option 1: Every X days */}
        <DailyIntervalRow control={control} isActive={pattern === 'daily'} isReadOnly={isReadOnly} />

        {/* Option 2: Every Weekday */}
        <DailyWeekdayRow isReadOnly={isReadOnly} />
      </RadioGroup>
    </div>
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
  const {
    formState: { errors },
  } = useFormContext();
  const disabled = !isActive || isReadOnly;

  // Only show error if this specific radio is selected
  const hasErrorInRow = isActive && !!errors.dayValue;

  return (
    <FormItem className="flex items-center gap-3 space-y-0" data-error={hasErrorInRow}>
      <FormControl className="mx-5.5">
        <RadioGroupItem value="daily" data-error={hasErrorInRow} />
      </FormControl>
      <div className="flex flex-row items-center gap-2">
        <FormLabel data-error={hasErrorInRow}>Every</FormLabel>
        <NumberFormInput control={control} name="dayValue" disabled={disabled} showError={isActive} />
        <FormLabel data-error={hasErrorInRow}>Days</FormLabel>
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
