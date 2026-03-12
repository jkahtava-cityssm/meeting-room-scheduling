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
import { step1Schema } from "./event-drawer-schema.validator";

import { RoomSelect } from "../rooms/room-select";
import { StatusSelect } from "../status/status-select";
import { UserComboBox } from "../users/user-combobox";
import { EventDrawerPermissions } from "./lib/permissions";

import { StaticTabsList, StaticTabsTrigger } from "@/components/ui/tabs-placeholder";
import { UserMultiSelect } from "../users/user-muliselect";
import { ItemMultiSelect } from "./item-multiselect";

import { StartEndDateTimeProvider } from "@/components/calendar-start-end-datetime-provider/StartEndDateTimeProvider";
import { Label } from "@/components/ui/label";

const toDate = (v: string | Date | null | undefined) => (v instanceof Date ? v : v ? new Date(v) : new Date());

export const Step1 = ({ formStatus, session }: { formStatus: FormStatus; session: Session | null }) => {
  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<typeof step1Schema>>();
  const { can, isVerifying } = EventDrawerPermissions.usePermissions();

  const disableChangeStatus = !can("ChangeEventStatus");
  const disableChangeUser = !can("ChangeEventUser");
  const enableMultiDay = can("ToggleMultiDay");
  const allowRecurrence = can("ToggleRecurrence");
  const restrictHours = !can("AllowOutsideHours");

  const endDatePickerRef = useRef<DateTimePickerRef>(null);
  const isReadOnly = formStatus === "Read" || formStatus === "Loading";
  const isRecurring = watch("isRecurring");
  const userId = watch("userId");

  const synchronizeEndDate = isRecurring === "true" || !enableMultiDay;
  const hideEndDate = isRecurring === "false" || !enableMultiDay;

  console.log(enableMultiDay, isRecurring);
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
                      const b = new Date(startDate);
                      endDatePickerRef.current?.updateDate(startDate);

                      //setValue("endDate", getValues("startDate"));
                      setValue("duration", getDurationText(...getValues(["startDate", "endDate"])));
                    }
                    field.onChange(value);

                    //setIgnoreLastStep(value === "false" ? true : false);
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
              Single Day
            </StaticTabsTrigger>
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
        minHour={0}
        maxHour={23}
        minuteInterval={15}
        preserveDuration={true}
        clampEndToStart={true}
      >
        <FormField
          control={control}
          name="startDate"
          render={({ fieldState }) => (
            <FormItem className="col-span-2 row-3 grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <StartEndDateTimeProvider.StartDate invalid={!!fieldState.error} isDisabled={isReadOnly} />
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
                {hideEndDate ? (
                  <StartEndDateTimeProvider.EndDate invalid={!!fieldState.error} isDisabled={isReadOnly} />
                ) : (
                  <StartEndDateTimeProvider.NoDataPlaceholder
                    invalid={!!fieldState.error}
                    isDisabled={true}
                    label="End Date"
                    message={
                      !enableMultiDay
                        ? "Single Day Requests Only"
                        : isRecurring
                          ? "Calculated by Recurrence"
                          : "Unknown"
                    }
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
              <Input
                id="duration"
                disabled={isReadOnly}
                className="text-sm h-9 px-3 py-1 content-center"
                //defaultValue={field.value}
                value={field.value}
                data-invalid={fieldState.invalid}
                readOnly
              ></Input>
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
