import { Control } from "react-hook-form";

import z from "zod/v4";
import { step2Schema } from "../event-drawer-schema.validator";

export function ErrorMessage({
  control,
  fieldName,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  fieldName: keyof z.infer<typeof step2Schema>;
}) {
  return (
    control.getFieldState(fieldName).error && (
      <span className="text-destructive text-sm">{control.getFieldState(fieldName).error?.message}</span>
    )
  );
}
