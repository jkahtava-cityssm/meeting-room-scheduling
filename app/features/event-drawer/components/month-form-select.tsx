import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Control, FieldPath, FieldValues } from 'react-hook-form';

export function MonthFormSelection<TFieldValues extends FieldValues>({
  control,
  name,
  disabled,
  showError = true,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  disabled: boolean;
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
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={'min-w-31'}>
                {MONTHS.map((month) => {
                  return (
                    <SelectItem key={month.id} value={month.id} className="flex-1">
                      {month.label}
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

const MONTHS = [
  {
    id: '1',
    label: 'January',
  },
  {
    id: '2',
    label: 'February',
  },
  {
    id: '3',
    label: 'March',
  },
  {
    id: '4',
    label: 'April',
  },
  {
    id: '5',
    label: 'May',
  },
  {
    id: '6',
    label: 'June',
  },
  {
    id: '7',
    label: 'July',
  },
  {
    id: '8',
    label: 'August',
  },
  {
    id: '9',
    label: 'September',
  },
  {
    id: '10',
    label: 'October',
  },
  {
    id: '11',
    label: 'November',
  },
  {
    id: '12',
    label: 'December',
  },
] as const;
