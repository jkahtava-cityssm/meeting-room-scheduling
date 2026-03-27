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
import { Checkbox } from "@/components/ui/checkbox";
import { GenericError } from "@/components/shared/generic-error";
import { GenericInfoMessage } from "@/components/shared/generic-message";

const toDate = (v: string | Date | null | undefined) => (v instanceof Date ? v : v ? new Date(v) : new Date());

export const Step1 = ({ formStatus }: { formStatus: FormStatus }) => {
  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<typeof step1Schema>>();

  const isManaged = watch("isManaged") === "true";
  const isReadOnly = formStatus === "Read" || formStatus === "Loading";
  const isManagedReadOnly = isReadOnly || isManaged;

  return (
    <div className="flex flex-col gap-4 min-h-0 ">
      <div className="flex flex-row gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem className="flex-1">
              {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Name</FormLabel>}
              <FormControl>
                <Input
                  id="name"
                  disabled={isManagedReadOnly}
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
            <FormItem className="flex-1">
              {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Email</FormLabel>}
              <FormControl>
                <Input
                  id="email"
                  disabled={isManagedReadOnly}
                  placeholder="Enter an Email"
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
      <div className="flex flex-row gap-4">
        <FormField
          control={control}
          name="department"
          render={({ field, fieldState }) => (
            <FormItem className="flex-1">
              {fieldState.invalid ? (
                <FormMessage className="leading-none font-medium" />
              ) : (
                <FormLabel>Department</FormLabel>
              )}
              <FormControl>
                <Input
                  id="department"
                  disabled={isManagedReadOnly}
                  placeholder="Select a Department"
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
            <FormItem className="flex-1">
              {fieldState.invalid ? (
                <FormMessage className="leading-none font-medium" />
              ) : (
                <FormLabel>Job Title</FormLabel>
              )}
              <FormControl>
                <Input
                  id="jobTitle"
                  disabled={isManagedReadOnly}
                  placeholder="Enter a Job Title"
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
      <div className="flex flex-row gap-4">
        <FormField
          control={control}
          name="externalId"
          render={({ field, fieldState }) => (
            <FormItem className="w-1/2 pr-2">
              {fieldState.invalid ? (
                <FormMessage className="leading-none font-medium" />
              ) : (
                <FormLabel className="truncate">External ID (eg. Employee #, Client #, Reference #)</FormLabel>
              )}
              <FormControl>
                <Input
                  id="externalId"
                  disabled={isManagedReadOnly}
                  placeholder="Enter an Identifier"
                  data-invalid={fieldState.invalid}
                  value={field.value}
                  onChange={field.onChange}
                  className="min-w-0 w-full"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex flex-row gap-4 justify-between">
          <FormField
            control={control}
            name="isActive"
            render={({ field, fieldState }) => (
              <FormItem className="justify-items-center  w-40">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium" />
                ) : (
                  <FormLabel>Status</FormLabel>
                )}
                <FormControl>
                  <Tabs
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  >
                    <TabsList
                      className="gap-2"
                      aria-disabled={isManagedReadOnly}
                      data-invalid={fieldState.invalid}
                      aria-invalid={fieldState.invalid}
                    >
                      <TabsTrigger value="true" disabled={isManagedReadOnly}>
                        Active
                      </TabsTrigger>
                      <TabsTrigger value="false" disabled={isManagedReadOnly}>
                        Disabled
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="emailEnabled"
            render={({ field, fieldState }) => (
              <FormItem className="items-center justify-center justify-items-center w-40">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium" />
                ) : (
                  <FormLabel>Send Notifications</FormLabel>
                )}
                <FormControl>
                  <Tabs
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  >
                    <TabsList
                      className="gap-2"
                      aria-disabled={isReadOnly}
                      data-invalid={fieldState.invalid}
                      aria-invalid={fieldState.invalid}
                    >
                      <TabsTrigger value="true" disabled={isReadOnly}>
                        Yes
                      </TabsTrigger>
                      <TabsTrigger value="false" disabled={isReadOnly}>
                        No
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
      <div className="flex flex-row ">
        {isManaged && (
          <GenericInfoMessage
            title="User Details Locked"
            message="Limited updates are allowed, the current user is managed by an external system."
          ></GenericInfoMessage>
        )}
      </div>
    </div>
  );
};
