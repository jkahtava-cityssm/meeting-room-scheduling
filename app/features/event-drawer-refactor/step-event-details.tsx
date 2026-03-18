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
import { EventDrawerPermissions } from "./lib/permissions";

import { StaticTabsList, StaticTabsTrigger } from "@/components/ui/tabs-placeholder";
import { UserMultiSelect } from "../users/user-muliselect";
import { ItemMultiSelect } from "./item-multiselect";

import { StartEndDateTimeProvider } from "@/components/calendar-start-end-datetime-provider/StartEndDateTimeProvider";
import { Label } from "@/components/ui/label";
import { addDays, format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideLock } from "lucide-react";
import { useMultiStepForm } from "./multi-step-form-shell";
import { TimeInterval } from "@/components/calendar-time-picker/useTimePicker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getStep1Schema } from "./event-drawer-schema.validator";

const toDate = (v: string | Date | null | undefined) => (v instanceof Date ? v : v ? new Date(v) : new Date());

export const Step1 = ({ formStatus, session }: { formStatus: FormStatus; session: Session | null }) => {
  const { minHour, maxHour, interval, maxSpan } = useMultiStepForm();
  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<ReturnType<typeof getStep1Schema>>>();
  const { can, isVerifying } = EventDrawerPermissions.usePermissions();

  const disableChangeStatus = !can("ChangeEventStatus");
  const disableChangeUser = !can("ChangeEventUser");
  const enableMultiDay = can("ToggleMultiDay");
  const allowRecurrence = can("ToggleRecurrence");
  const restrictHours = !can("IgnoreHours");
  const restrictBookingSpan = !can("IgnoreBookingSpan");

  const isReadOnly = formStatus === "Read" || formStatus === "Loading";
  const isRecurring = watch("isRecurring");
  const userId = watch("userId");

  const showEndDate = isRecurring === "false" && enableMultiDay;

  const startRaw = useWatch({ control, name: "startDate" });
  const endRaw = useWatch({ control, name: "endDate" });

  const startDate = toDate(startRaw);
  const endDate = toDate(endRaw);

  const handleStartEndDateTimeChange = async (start: Date, end: Date) => {
    const options = { shouldDirty: true, shouldTouch: false, shouldValidate: false };
    setValue("startDate", start.toISOString(), options);
    setValue("endDate", end.toISOString(), options);

    setValue("duration", getDurationText(start.toISOString(), end.toISOString()), options);

    await trigger(["startDate", "endDate"], { shouldFocus: false });
  };

  const changeDateOnly = (newDate: string, oldDate: string) => {
    const originalDate = new Date(newDate);
    const updated = new Date(oldDate);

    updated.setFullYear(originalDate.getFullYear());
    updated.setMonth(originalDate.getMonth());
    updated.setDate(originalDate.getDate());

    return updated.toISOString();
  };

  return (
    <div className="grid grid-cols-3 gap-4 min-h-0 auto-rows-min">
      <FormField
        control={control}
        name="roomId"
        render={({ field, fieldState }) => (
          <FormItem className="col-span-1 row-1">
            {fieldState.invalid ? (
              <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
            ) : (
              <FormLabel>Room</FormLabel>
            )}
            <FormControl>
              <RoomSelect
                selectedRoomId={field.value}
                includeAllOption={false}
                onRoomChange={(value) => field.onChange(value)}
                dataInvalid={fieldState.invalid}
                isDisabled={isReadOnly}
                className="w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />
      {allowRecurrence ? (
        <FormField
          control={control}
          name="isRecurring"
          render={({ field, fieldState }) => (
            <FormItem className="col-span-1 row-1 xs:justify-items-center">
              {fieldState.invalid ? (
                <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
              ) : (
                <FormLabel>Event Type</FormLabel>
              )}
              <FormControl>
                <Tabs
                  defaultValue={field.value}
                  onValueChange={(value) => {
                    const startDate = getValues("startDate");
                    const endDate = getValues("endDate");

                    if (value === "true" && startDate !== endDate) {
                      const updateDate = changeDateOnly(getValues("startDate"), getValues("endDate"));
                      setValue("endDate", updateDate);
                      setValue("duration", getDurationText(...getValues(["startDate", "endDate"])));
                    }
                    field.onChange(value);
                  }}
                >
                  <TabsList
                    className="gap-2"
                    aria-disabled={isReadOnly}
                    data-invalid={fieldState.invalid}
                    aria-invalid={fieldState.invalid}
                  >
                    <TabsTrigger value="false" disabled={isReadOnly}>
                      Single
                    </TabsTrigger>

                    <TabsTrigger value="true" disabled={isReadOnly}>
                      Recurring
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormControl>
            </FormItem>
          )}
        />
      ) : (
        <div className="grid gap-2 col-span-1 row-1 xs:justify-items-center">
          <FormLabel>Event Type</FormLabel>
          <StaticTabsList aria-disabled={isReadOnly}>
            <StaticTabsTrigger state="active" disabled={isReadOnly}>
              Single
            </StaticTabsTrigger>

            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <StaticTabsTrigger state="inactive" disabled={isReadOnly} className="cursor-not-allowed">
                  Recurring
                  <LucideLock className="stroke-muted-foreground" />
                </StaticTabsTrigger>
              </TooltipTrigger>
              <TooltipContent>You do not have the permission to create Recurring Events</TooltipContent>
            </Tooltip>
          </StaticTabsList>
        </div>
      )}
      <FormField
        control={control}
        name="statusId"
        render={({ field, fieldState }) => (
          <FormItem className="col-span-1 row-1">
            {fieldState.invalid ? (
              <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
            ) : (
              <FormLabel>Status</FormLabel>
            )}

            <StatusSelect
              selectedStatusId={field.value}
              includeAllOption={false}
              onStatusChange={field.onChange}
              isDisabled={isReadOnly || disableChangeStatus}
              dataInvalid={fieldState.invalid}
              className="min-w-0 w-full"
            />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <FormItem className="col-span-2 row-2">
            {fieldState.invalid ? <FormMessage className="leading-none font-medium" /> : <FormLabel>Title</FormLabel>}
            <FormControl>
              <Input
                id="title"
                disabled={isReadOnly}
                placeholder="Enter a title"
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
        name="eventItemIds"
        render={({ field, fieldState }) => (
          <FormItem className="col-span-1 row-2">
            {fieldState.invalid ? (
              <FormMessage className="leading-none font-medium" />
            ) : (
              <FormLabel>Requested Items</FormLabel>
            )}
            <FormControl>
              <ItemMultiSelect
                selectedItemIds={field.value}
                onChange={field.onChange}
                isDisabled={isReadOnly}
                className="min-w-0 w-full"
              ></ItemMultiSelect>
            </FormControl>
          </FormItem>
        )}
      />
      <StartEndDateTimeProvider
        startDate={startDate}
        endDate={endDate}
        onChange={handleStartEndDateTimeChange}
        minHour={restrictHours ? minHour : 0}
        maxHour={restrictHours ? maxHour : 24}
        minuteInterval={interval as TimeInterval}
        preserveDuration={true}
        clampEndToStart={true}
      >
        <FormField
          control={control}
          name="startDate"
          render={({ fieldState }) => (
            <FormItem className="col-span-2 row-3 grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <StartEndDateTimeProvider.StartDate
                  invalid={!!fieldState.error}
                  isDisabled={isReadOnly}
                  maxFutureDate={restrictBookingSpan && maxSpan > 0 ? addDays(new Date(), maxSpan) : undefined}
                />
              </div>
              <div className="flex flex-col gap-2 items-center">
                <StartEndDateTimeProvider.StartTime invalid={!!fieldState.error} isDisabled={isReadOnly} />
              </div>
              {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endDate"
          render={({ fieldState }) => (
            <FormItem className="col-span-2 row-4 grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                {showEndDate ? (
                  <StartEndDateTimeProvider.EndDate
                    invalid={!!fieldState.error}
                    isDisabled={isReadOnly}
                    maxFutureDate={restrictBookingSpan && maxSpan > 0 ? addDays(new Date(), maxSpan) : undefined}
                  />
                ) : (
                  <StartEndDateTimeProvider.NoDataPlaceholder
                    invalid={!!fieldState.error}
                    isDisabled={true}
                    label="End Date"
                    message={
                      !enableMultiDay
                        ? "You do not have the permission to create Multi-Day events"
                        : isRecurring
                          ? "Calculated by Recurrence"
                          : "Unknown"
                    }
                    date={format(startDate, "PPP")}
                    className="cursor-not-allowed border shadow-none border-dashed "
                  />
                )}
              </div>
              <div className="flex flex-col gap-2 items-center">
                <StartEndDateTimeProvider.EndTime invalid={!!fieldState.error} isDisabled={isReadOnly} />
              </div>
              {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
            </FormItem>
          )}
        />
      </StartEndDateTimeProvider>
      <FormField
        control={control}
        name="duration"
        render={({ field, fieldState }) => (
          <FormItem className="col-span-1  row-4">
            {fieldState.invalid ? (
              <FormMessage className="leading-none font-medium" />
            ) : (
              <FormLabel>Duration:</FormLabel>
            )}
            <FormControl>
              <div
                id={`duration`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "bg-accent/50 hover:bg-accent/50",
                  "group relative h-9 w-full whitespace-nowrap px-3 py-2 font-normal  disabled:opacity-75 justify-between",
                  "border shadow-none border-dashed ",
                )}
                data-invalid={fieldState.invalid}
              >
                {field.value}
              </div>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="userId"
        render={({ field, fieldState }) => (
          <FormItem className="col-span-1 row-5">
            {fieldState.invalid ? (
              <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
            ) : (
              <FormLabel htmlFor={undefined}>Requesting User</FormLabel>
            )}
            <UserComboBox
              selectedUserId={field.value}
              onUserChange={(id: string, label: string) => field.onChange(id)}
              dataInvalid={fieldState.invalid}
              isDisabled={isReadOnly || disableChangeUser}
              className="min-w-60"
            ></UserComboBox>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="eventRecipientIds"
        render={({ field, fieldState }) => (
          <FormItem className="col-span-3 row-6">
            {fieldState.invalid ? (
              <FormMessage className="leading-none font-medium" />
            ) : (
              <FormLabel>Notify Users</FormLabel>
            )}
            <FormControl>
              <UserMultiSelect
                selectedUserIds={field.value}
                excludeUserIds={[userId]}
                onChange={field.onChange}
                isDisabled={isReadOnly}
                className="min-w-0 w-full"
                maxCount={4}
              ></UserMultiSelect>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem className="col-span-4">
            <div className="flex gap-2">
              {fieldState.invalid ? (
                <FormMessage className="leading-none font-medium" />
              ) : (
                <FormLabel>Description</FormLabel>
              )}
            </div>

            <FormControl>
              <Textarea
                className="min-h-20 max-h-50 resize-none"
                id="description"
                disabled={isReadOnly}
                {...field}
                value={field.value}
                data-invalid={fieldState.invalid}
              ></Textarea>
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
