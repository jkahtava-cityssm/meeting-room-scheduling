import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Control, FieldPath, FieldValues } from 'react-hook-form';

export function WeekDayFormSelection<TFieldValues extends FieldValues>({
  control,
  name,
  disabled,
  hideDayWeekday = true,
  showError = true,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  disabled: boolean;
  hideDayWeekday?: boolean;
  showError?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex flex-row gap-2">
            <Select
              name={field.name}
              value={field.value}
              defaultValue={field.value}
              key={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger
                  id={field.name}
                  data-invalid={fieldState.invalid && showError}
                  aria-invalid={fieldState.invalid && showError}
                  className={'min-w-31'}
                >
                  <SelectValue placeholder="Select a weekday" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={'min-w-31'}>
                {WEEKDAY_PATTERNS.map((period) => {
                  if (hideDayWeekday && (period.id === 'day' || period.id === 'weekday' || period.id === 'weekend')) {
                    return;
                  }

                  return (
                    <SelectItem key={period.id} value={period.id} className="flex-1">
                      {period.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </FormItem>
      )}
    />
  );
}

const WEEKDAY_PATTERNS = [
  {
    id: 'monday',
    label: 'Monday',
  },
  {
    id: 'tuesday',
    label: 'Tuesday',
  },
  {
    id: 'wednesday',
    label: 'Wednesday',
  },
  {
    id: 'thursday',
    label: 'Thursday',
  },
  {
    id: 'friday',
    label: 'Friday',
  },
  {
    id: 'saturday',
    label: 'Saturday',
  },
  {
    id: 'sunday',
    label: 'Sunday',
  },
  {
    id: 'day',
    label: 'Day',
  },
  {
    id: 'weekday',
    label: 'Weekday',
  },
  {
    id: 'weekend',
    label: 'Weekend',
  },
] as const;
