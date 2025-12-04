import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod/v4";
import { useMultiStepForm } from "./multi-step-form";
import { step1Schema } from "./event-drawer.validator";

import { TColors } from "@/lib/types";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookKey, Loader2Icon } from "lucide-react";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { IconColored } from "@/components/ui/icon-colored";
import { ScrollBar } from "@/components/ui/scroll-area";

import { Textarea } from "@/components/ui/textarea";
import { useRoomsQuery } from "@/lib/services/rooms";
import { Select } from "@/components/ui/select";

import { formatDuration, intervalToDuration } from "date-fns";
import { ComboBox, ComboBoxTrigger } from "@/components/ui/combobox";
import { FormStatus } from "./types";
import { useUsersQuery } from "@/lib/services/users";
import { Button } from "@/components/ui/button";
import { useStatusQuery } from "@/lib/services/references";
import { DateTimePicker, DateTimePickerRef } from "@/components/ui/datetimepicker";
import { useRef } from "react";
import { Session } from "@/lib/auth-client";
import { getDurationText } from "@/lib/helpers";

export const Step1 = ({ formStatus, session }: { formStatus: FormStatus; session: Session | null }) => {
  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<typeof step1Schema>>();

  const { setIgnoreLastStep, setStartDate, userId } = useMultiStepForm();

  const { data: rooms } = useRoomsQuery(false);
  const { data: users } = useUsersQuery();
  const { data: status } = useStatusQuery();

  const endDatePickerRef = useRef<DateTimePickerRef>(null);

  const userList = users
    ? users.map((user) => {
        return { key: String(user.userId), label: user.name, value: String(user.userId) };
      })
    : [];

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
                {rooms && (
                  <Select
                    disabled={isReadOnly}
                    //readonly={isReadOnly}
                    //{...field}
                    name={field.name}
                    value={field.value}
                    //defaultValue={field.value}
                    key={field.value}
                    onValueChange={(value: string) => {
                      if (value === "") {
                        //There is a Bug with the Select Field when used with React Hook Form:
                        //https://github.com/radix-ui/primitives/issues/2944
                        //https://github.com/radix-ui/primitives/issues/3135
                        //We can also prevent this behaviour by forcing a re-render if we add the property key={field.value}
                        //return;
                      }

                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className="min-w-52">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent className="min-w-52">
                      {rooms?.map((room) => {
                        return (
                          <SelectItem key={room.roomId} value={room.roomId?.toString()} className="flex-1">
                            <div className="flex items-center gap-2">
                              <IconColored color={room.color as TColors} showBorder={false} hideBackground={true}>
                                <BookKey />
                              </IconColored>

                              <p className="truncate">{room.name}</p>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                {!rooms && (
                  <Button variant={"outline"} disabled>
                    <Loader2Icon className="animate-spin" />
                    Collecting Rooms
                  </Button>
                )}
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
                        endDatePickerRef.current?.updateDate(startDate);

                        //setValue("endDate", getValues("startDate"));
                        setValue("duration", getDurationText(...getValues(["startDate", "endDate"])));
                      }
                      field.onChange(value);

                      setIgnoreLastStep(value === "false" ? true : false);
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

                <ComboBox
                  value={field.value}
                  list={userList}
                  noResultText={"No User Found"}
                  searchText={"Search User"}
                  onSelect={(value: string) => field.onChange(value)}
                >
                  {users && !userId && (
                    <FormControl>
                      <ComboBoxTrigger
                        disabled={isReadOnly}
                        value={field.value}
                        list={userList}
                        placeholderText={"Select Member"}
                      ></ComboBoxTrigger>
                    </FormControl>
                  )}
                </ComboBox>
                {!users && (
                  <Button variant={"outline"} disabled>
                    <Loader2Icon className="animate-spin" />
                    Collecting Users
                  </Button>
                )}
                {userId && users && (
                  <Button variant={"outline"} disabled>
                    {users?.find((user) => String(user.userId) === field.value)?.name}
                  </Button>
                )}
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

                {status && !userId && (
                  <Select
                    disabled={isReadOnly}
                    //readonly={isReadOnly}
                    //{...field}
                    name={field.name}
                    value={field.value}
                    //defaultValue={field.value}
                    key={field.value}
                    onValueChange={(value: string) => {
                      if (value === "") {
                        //There is a Bug with the Select Field when used with React Hook Form:
                        //https://github.com/radix-ui/primitives/issues/2944
                        //https://github.com/radix-ui/primitives/issues/3135
                        //We can also prevent this behaviour by forcing a re-render if we add the property key={field.value}
                        //return;
                      }
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className="min-w-52">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="min-w-52">
                      {status?.map((status) => {
                        return (
                          <SelectItem key={String(status.statusId)} value={String(status.statusId)} className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate">{status.name}</p>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                {!status && (
                  <Button variant={"outline"} disabled>
                    <Loader2Icon className="animate-spin" />
                    Collecting Status
                  </Button>
                )}
                {userId && status && (
                  <Button variant={"outline"} disabled>
                    {status?.find((status) => String(status.statusId) === field.value)?.name}
                  </Button>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-2 row-3">
                <div className="flex gap-2  justify-items-center">
                  {fieldState.invalid && <FormMessage className="leading-none font-medium" />}
                </div>

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

                        setStartDate(isoString);
                        trigger(["startDate", "endDate"]);
                      } else {
                        field.onChange(isoString);
                        setValue("duration", getDurationText(...getValues(["startDate", "endDate"])));
                      }
                    }}
                    placeholder="Select a date"
                    data-invalid={fieldState.invalid}
                    className="min-w-52"
                    label={"Start Date"}
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
                <div className="flex gap-2">
                  {fieldState.invalid && <FormMessage className="leading-none font-medium" />}
                </div>

                <FormControl>
                  <DateTimePicker
                    id="endDate"
                    ref={endDatePickerRef}
                    disabled={isReadOnly}
                    value={field.value}
                    onChange={(isoString) => {
                      field.onChange(isoString);
                      setValue("duration", getDurationText(...getValues(["startDate", "endDate"])));
                    }}
                    placeholder="Select a date"
                    data-invalid={fieldState.invalid}
                    className="min-w-52"
                    label={"End Date"}
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

/*<div className="flex flex-col gap-3">
      
        /*<div>
        <Input {...register("email")} placeholder="Email" />
        <Input {...register("firstName")} placeholder="First Name" />
        <Input {...register("lastName")} placeholder="Last Name" />
      </div>
      <NextButton onClick={handleStepSubmit} />
    </div>*/
