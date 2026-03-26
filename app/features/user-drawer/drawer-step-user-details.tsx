import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod/v4";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { Textarea } from "@/components/ui/textarea";

import { DateTimePicker, DateTimePickerRef } from "@/components/ui/datetimepicker";
import { useRef } from "react";
import { Session } from "@/lib/auth-client";
import { getDurationText } from "@/lib/helpers";
import { FormStatus } from "./types";

import { RoomSelect } from "../rooms/room-select";
import { StatusSelect } from "../status/status-select";
import { UserComboBox } from "../users/user-combobox";

import { StaticTabsList, StaticTabsTrigger } from "@/components/ui/tabs-placeholder";
import { UserMultiSelect } from "../users/user-multiselect";
import { ItemMultiSelect } from "./item-multiselect";

import { StartEndDateTimeProvider } from "@/components/calendar-start-end-datetime-provider/StartEndDateTimeProvider";
import { Label } from "@/components/ui/label";
import { addDays, format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideLock } from "lucide-react";
import { useMultiStepForm } from "./drawer-form-provider";
import { TimeInterval } from "@/components/calendar-time-picker/useTimePicker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { step1Schema } from "./drawer-schema.validator";
import { UserDrawerPermissions } from "./lib/permissions";

const toDate = (v: string | Date | null | undefined) => (v instanceof Date ? v : v ? new Date(v) : new Date());

export const Step1 = ({ formStatus, session }: { formStatus: FormStatus; session: Session | null }) => {
  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<typeof step1Schema>>();
  const { can, isVerifying } = UserDrawerPermissions.usePermissions();

  const isReadOnly = formStatus === "Read" || formStatus === "Loading";

  return (
    <div className="flex gap-4 min-h-0 ">
      <FormField
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <FormItem className="">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
            <FormControl>
              <Input
                id="name"
                disabled={isReadOnly}
                placeholder="Enter a Name"
                data-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                className="min-w-0 w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormItem className="">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
            <FormControl>
              <Input
                id="email"
                disabled={isReadOnly}
                placeholder="Enter a Name"
                data-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                className="min-w-0 w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="emailEnabled"
        render={({ field, fieldState }) => (
          <FormItem className="">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
            <FormControl>
              <Input
                id="emailEnabled"
                disabled={isReadOnly}
                placeholder="Enter a Name"
                data-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                className="min-w-0 w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="department"
        render={({ field, fieldState }) => (
          <FormItem className="">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
            <FormControl>
              <Input
                id="department"
                disabled={isReadOnly}
                placeholder="Enter a Name"
                data-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                className="min-w-0 w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="jobTitle"
        render={({ field, fieldState }) => (
          <FormItem className="">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
            <FormControl>
              <Input
                id="jobTitle"
                disabled={isReadOnly}
                placeholder="Enter a Name"
                data-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                className="min-w-0 w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="externalId"
        render={({ field, fieldState }) => (
          <FormItem className="">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
            <FormControl>
              <Input
                id="externalId"
                disabled={isReadOnly}
                placeholder="Enter a Name"
                data-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                className="min-w-0 w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="isActive"
        render={({ field, fieldState }) => (
          <FormItem className="">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
            <FormControl>
              <Input
                id="isActive"
                disabled={isReadOnly}
                placeholder="Enter a Name"
                data-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                className="min-w-0 w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="isManaged"
        render={({ field, fieldState }) => (
          <FormItem className="">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
            <FormControl>
              <Input
                id="isManaged"
                disabled={isReadOnly}
                placeholder="Enter a Name"
                data-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                className="min-w-0 w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
