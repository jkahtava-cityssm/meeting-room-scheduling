import { FormControl, FormField, FormItem } from "@/components/ui/form";
import InputNumber from "@/components/ui/input-number";
import { Control, FieldPathByValue, FieldValues } from "react-hook-form";

export function NumberFormInput<
  TFieldValues extends FieldValues,
  TPath extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  disabled = false,
  showError = true,
}: {
  control: Control<TFieldValues>;
  name: TPath;
  disabled?: boolean;
  showError?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <InputNumber
                  type="number"
                  className="w-15 text-center"
                  max={999}
                  min={1}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="#"
                  disabled={disabled}
                  data-invalid={fieldState.invalid && showError}
                  aria-invalid={fieldState.invalid && showError}
                ></InputNumber>
              </FormControl>
            </FormItem>
          </FormControl>
          {
            //
          }
        </FormItem>
      )}
    />
  );
}
