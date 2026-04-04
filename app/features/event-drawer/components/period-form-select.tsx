import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Control, FieldPath, FieldPathByValue, FieldValues, useFormContext } from 'react-hook-form';

export function PeriodFormSelection<TFieldValues extends FieldValues>({
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
  const { clearErrors } = useFormContext();
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
              key={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                clearErrors(name);
              }}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger
                  id={field.name}
                  data-invalid={fieldState.invalid && showError}
                  aria-invalid={fieldState.invalid && showError}
                  className={'min-w-23'}
                >
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={'min-w-23'}>
                {periods.map((period) => {
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

const periods = [
  {
    id: '1',
    label: 'first',
  },
  {
    id: '2',
    label: 'second',
  },
  {
    id: '3',
    label: 'third',
  },
  {
    id: '4',
    label: 'fourth',
  },
  {
    id: '-1',
    label: 'last',
  },
] as const;
