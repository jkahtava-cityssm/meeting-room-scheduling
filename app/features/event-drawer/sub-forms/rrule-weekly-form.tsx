import { useWatch, Control } from "react-hook-form";
import { z } from "zod/v4";

import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

import { NumberFormInput } from "../components/number-form-input";

import { Checkbox } from "@/components/ui/checkbox";
import { ErrorMessage } from "../components/error-message";
import { step2Schema } from "../drawer-schema.validator";

export function WeeklyForm({
  control,
  isReadOnly,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
}) {
  return (
    <div className="grid gap-8">
      <div className="flex flex-row gap-2">
        <FormLabel className="min-w-15  justify-end">Every</FormLabel>
        <NumberFormInput control={control} name={"weekValue"} disabled={isReadOnly} />
        <FormLabel>Weeks</FormLabel>
      </div>
      <div className="flex flex-col flex-wrap gap-2 max-h-40 max-w-60">
        {WEEKDAYS.map((day) => (
          <WeekdayCheckbox key={day.id} day={day} control={control} isReadOnly={isReadOnly} />
        ))}
      </div>
      {
        //<ErrorMessage control={control} fieldName="weekdays" />
      }
    </div>
  );
}

function WeekdayCheckbox({
  day,
  control,
  isReadOnly,
}: {
  day: (typeof WEEKDAYS)[number];
  control: Control<z.infer<typeof step2Schema>>;
  isReadOnly: boolean;
}) {
  return (
    <FormField
      control={control}
      name="weekdays"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox
              disabled={isReadOnly}
              checked={field.value?.includes(day.id)}
              onCheckedChange={(checked) => {
                const current = field.value || [];
                const updated = checked ? [...current, day.id] : current.filter((value: string) => value !== day.id);
                field.onChange(updated);
              }}
            />
          </FormControl>
          <FormLabel className="text-sm font-normal cursor-pointer">{day.label}</FormLabel>
        </FormItem>
      )}
    />
  );
}

const WEEKDAYS = [
  {
    id: "monday",
    label: "Monday",
  },
  {
    id: "tuesday",
    label: "Tuesday",
  },
  {
    id: "wednesday",
    label: "Wednesday",
  },
  {
    id: "thursday",
    label: "Thursday",
  },
  {
    id: "friday",
    label: "Friday",
  },
  {
    id: "saturday",
    label: "Saturday",
  },
  {
    id: "sunday",
    label: "Sunday",
  },
] as const;
