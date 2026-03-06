import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod/v4";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookKey, Loader2Icon } from "lucide-react";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { Textarea } from "@/components/ui/textarea";
import { useRoomsQuery } from "@/lib/services/rooms";

import { ComboBox, ComboBoxTrigger } from "@/components/ui/combobox";

import { useUsersQuery } from "@/lib/services/users";
import { Button } from "@/components/ui/button";
import { useStatusQuery } from "@/lib/services/status";
import { DateTimePicker, DateTimePickerRef } from "@/components/ui/datetimepicker";
import { useRef } from "react";
import { Session } from "@/lib/auth-client";
import { getDurationText } from "@/lib/helpers";
import { FormStatus } from "./types";
import { step1Schema } from "./event-drawer-schema.validator";
import { useMultiStepForm } from "./multi-step-form-shell";
import { RoomSelect } from "../rooms/room-select";
import { StatusSelect } from "../status/status-select";
import { UserComboBox } from "../users/user-combobox";

export const Step1 = ({ formStatus, session }: { formStatus: FormStatus; session: Session | null }) => {
  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<typeof step1Schema>>();

  const { userId } = useMultiStepForm();

  const endDatePickerRef = useRef<DateTimePickerRef>(null);
  const isReadOnly = formStatus === "Read" || formStatus === "Loading";
  const isRecurring = watch("isRecurring");

  return (
    <ScrollArea type="always">
      <div className="max-h-[calc(80dvh)] w-full">
        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={control}
            name="roomId"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
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
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="isRecurring"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 xs:justify-items-center">
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

          <FormField
            control={control}
            name="userId"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-col">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel htmlFor={undefined}>Requesting User</FormLabel>
                )}
                <UserComboBox
                  selectedUserId={field.value}
                  onUserChange={(id: string, label: string) => field.onChange(id)}
                  dataInvalid={fieldState.invalid}
                  isDisabled={isReadOnly}
                  className="min-w-60"
                ></UserComboBox>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 row-2">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium" />
                ) : (
                  <FormLabel>Title</FormLabel>
                )}
                <FormControl>
                  <Input
                    id="title"
                    disabled={isReadOnly}
                    placeholder="Enter a title"
                    data-invalid={fieldState.invalid}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="statusId"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-2">
                {fieldState.invalid ? (
                  <FormMessage className="leading-none font-medium overflow-ellipsis text-nowrap" />
                ) : (
                  <FormLabel>Status</FormLabel>
                )}

                <StatusSelect
                  selectedStatusId={field.value}
                  includeAllOption={false}
                  onStatusChange={field.onChange}
                  isDisabled={isReadOnly}
                  dataInvalid={fieldState.invalid}
                />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 row-3">
                <FormControl>
                  <DateTimePicker
                    id="startDate"
                    disabled={isReadOnly}
                    value={field.value}
                    onChange={(isoString) => {
                      if (isRecurring === "true") {
                        const endDate = endDatePickerRef.current?.calculateNewDate(isoString);

                        if (endDate) {
                          setValue("endDate", endDate, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: false,
                          });
                        }
                        setValue("startDate", isoString, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: false,
                        });

                        setValue("duration", getDurationText(...getValues(["startDate", "endDate"])));
                      } else {
                        field.onChange(isoString);
                        setValue("duration", getDurationText(...getValues(["startDate", "endDate"])));
                      }
                      trigger(["startDate", "endDate"]);
                    }}
                    placeholder="Select a date"
                    data-invalid={fieldState.invalid}
                    className="min-w-52"
                    label={"Start Date"}
                    errorMessage={fieldState.error?.message}
                  ></DateTimePicker>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="endDate"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 row-4">
                <FormControl>
                  <DateTimePicker
                    id="endDate"
                    ref={endDatePickerRef}
                    disabled={isReadOnly}
                    value={field.value}
                    onChange={(isoString) => {
                      if (isRecurring === "true") {
                        setValue("endDate", isoString, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: false,
                        });
                      } else {
                        field.onChange(isoString);
                        setValue("duration", getDurationText(...getValues(["startDate", "endDate"])));
                      }
                      trigger(["startDate", "endDate"]);
                    }}
                    placeholder="Select a date"
                    data-invalid={fieldState.invalid}
                    className="min-w-52"
                    label={"End Date"}
                    errorMessage={fieldState.error?.message}
                    hideDate={isRecurring === "true"}
                  ></DateTimePicker>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="duration"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2  row-5">
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
            name="description"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-4 row-span-3 ">
                <div className="flex gap-2">
                  {fieldState.invalid ? (
                    <FormMessage className="leading-none font-medium" />
                  ) : (
                    <FormLabel>Description</FormLabel>
                  )}
                </div>

                <FormControl>
                  <Textarea
                    className="max-h-70 min-h-70 resize-none"
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
        <div className="grid col-span-2 gap-2 grid-rows-3"></div>
      </div>
      <ScrollBar orientation="vertical" forceMount></ScrollBar>
    </ScrollArea>
  );
};
