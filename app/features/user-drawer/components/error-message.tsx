import { Control } from 'react-hook-form';

import z from 'zod/v4';
import { CombinedUserSchema } from '../drawer-schema.validator';

export function ErrorMessage({
  control,
  fieldName,
}: {
  control: Control<z.infer<typeof CombinedUserSchema>>;
  fieldName: keyof z.infer<typeof CombinedUserSchema>;
}) {
  return (
    control.getFieldState(fieldName).error && <span className="text-destructive text-sm">{control.getFieldState(fieldName).error?.message}</span>
  );
}
