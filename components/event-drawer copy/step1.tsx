import { useFormContext } from "react-hook-form";
import { Input } from "../ui/input";
import { NextButton } from "./nextbutton";
import { z } from "zod/v4";
import { useMultiStepForm } from "./stepped-form";
import { step1Schema } from "./event-flow.validator";

import { TColors } from "@/lib/types";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { BookKey, Check, ChevronsUpDown } from "lucide-react";

import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "../ui/form";
import { IconColored } from "../ui/icon-colored";
import { ScrollBar } from "../ui/scroll-area";
import { SingleDayPicker } from "../ui/single-day-picker";
import { Textarea } from "../ui/textarea";
import { useRoomsQuery } from "@/services/rooms";
import { TimePicker } from "../ui/time-picker";
import { Select } from "../ui/select";
import { useEffect, useImperativeHandle } from "react";

import { ForwardedRef } from "react";
import { combineDateTime } from "@/lib/helpers";
import { format, formatDuration, intervalToDuration, parse } from "date-fns";
import { IEvent } from "@/lib/schemas/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { ComboBox, ComboBoxContent, ComboBoxItem, ComboBoxList, ComboBoxTrigger, ComboBoxValue } from "../ui/combobox";

export const Step1 = ({ defaultValues }: { defaultValues: z.infer<typeof step1Schema> }) => {
  const {
    control,
    getValues,
    setValue,
    trigger,
    setError,
    formState: { errors },
    watch,
    reset,
  } = useFormContext<z.infer<typeof step1Schema>>();

  /*useEffect(() => {
    reset({
      ...defaultValues,
    });
  }, []);*/

  const members = [
    { key: "1", label: "Option 1", value: "1" },
    { key: "2", label: "Option 2", value: "2" },
  ];

  const { ignoreLastStep, setIgnoreLastStep } = useMultiStepForm();

  const { data: rooms } = useRoomsQuery(false);

  const isReadOnly = false;
  const isRecurring = watch("isRecurring");
  console.log(isRecurring);
  return (
    <ScrollArea type="always">
      <div className="max-h-[calc(80dvh)] w-full">
        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={control}
            name="roomId"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                <FormLabel id="roomLabel" htmlFor="room">
                  Room
                </FormLabel>
                <FormControl>
                  <Select
                    disabled={isReadOnly}
                    //readonly={isReadOnly}
                    //{...field}
                    name={field.name}
                    value={field.value}
                    defaultValue={field.value}
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
                    <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className="min-w-52">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>

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
                </FormControl>
                <FormMessage />
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
                  <FormLabel htmlFor="isRecurring">Event Type</FormLabel>
                )}
                <FormControl>
                  <Tabs
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      const startDate = getValues("startDate");
                      const endDate = getValues("endDate");

                      if (value === "true" && startDate !== endDate) {
                        setValue("endDate", getValues("startDate"));
                        setValue(
                          "duration",
                          getDurationText(...getValues(["startDate", "startTime", "endDate", "endTime"]))
                        );
                      }
                      field.onChange(value);

                      setIgnoreLastStep(value === "false" ? true : false);
                    }}
                  >
                    <TabsList className="gap-2" data-invalid={fieldState.invalid} aria-invalid={fieldState.invalid}>
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
          {/*
          <FormField
            control={control}
            name="memberId"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1">
                <FormLabel id="memberLabel" htmlFor="memberId">
                  Requestor
                </FormLabel>
                <ComboBox
                  //name={field.name}
                  value={field.value}
                  defaultValue={field.value}
                  onValueChange={(value) => console.log(value)}
                >
                  <ComboBoxTrigger asChild>
                    <FormControl>
                      <ComboBoxValue
                        placeholder="Select Room"
                        value={rooms?.find((room) => room.name === field.value)?.name}
                      ></ComboBoxValue>
                    </FormControl>
                  </ComboBoxTrigger>
                  <ComboBoxContent className="w-[200px] p-0">
                    <ComboBoxList className="h-9" searchPlaceholder="Search rooms..." searchEmptyText="No room found.">
                      {rooms?.map((room) => (
                        <ComboBoxItem
                          key={room.roomId}
                          value={room.roomId?.toString()}
                          onValueChange={(value) => {
                            console.log(value);
                            setValue("memberId", room.name);
                          }}
                        >
                          {room.name}
                        </ComboBoxItem>
                      ))}
                      {rooms?.map((room) => (
                        <CommandItem
                          value={room.name}
                          key={room.roomId}
                          onSelect={(value) => {
                            field.onChange(value);
                            //setValue("memberId", room.name);
                          }}
                        >
                          {room.name}
                          <Check className={cn("ml-auto", room.name === field.value ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      ))}
                    </ComboBoxList>
                  </ComboBoxContent>
                </ComboBox>
                <FormMessage />
              </FormItem>
            )}
          />
          */}
          <FormField
            control={control}
            name="memberId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Language</FormLabel>
                <ComboBox
                  value={field.value}
                  defaultValue={field.value}
                  list={members}
                  noResultText={"No Member Found"}
                  searchText={"Search Member"}
                  onSelect={(value: string) => field.onChange(value)}
                >
                  <FormControl>
                    <ComboBoxTrigger
                      value={field.value}
                      list={members}
                      placeholderText={"Select Member"}
                    ></ComboBoxTrigger>
                  </FormControl>
                </ComboBox>

                <FormDescription>This is the language that will be used in the dashboard.</FormDescription>
                <FormMessage />
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
                  <FormLabel htmlFor="title">Title</FormLabel>
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
            name="startDate"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-3">
                <div className="flex gap-2  justify-items-center">
                  {fieldState.invalid ? (
                    <FormMessage className="leading-none font-medium" />
                  ) : (
                    <FormLabel htmlFor="startDate">Start Date</FormLabel>
                  )}
                </div>

                <FormControl>
                  <SingleDayPicker
                    id="startDate"
                    disabled={isReadOnly}
                    value={field.value ? new Date(field.value) : new Date()}
                    onSelect={(date) => {
                      if (isRecurring === "true") {
                        setValue("endDate", date ? date.toISOString() : "");
                      }

                      field.onChange(date ? date.toISOString() : "");

                      trigger(["endDate", "endTime", "startTime"]);
                      setValue(
                        "duration",
                        getDurationText(...getValues(["startDate", "startTime", "endDate", "endTime"]))
                      );
                    }}
                    placeholder="Select a date"
                    data-invalid={fieldState.invalid}
                    className="min-w-52"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="startTime"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 row-3">
                <FormControl>
                  <TimePicker
                    id="startTime"
                    disabled={isReadOnly}
                    date={field.value ? new Date(field.value) : new Date()}
                    setDate={(date) => {
                      field.onChange(date ? date.toISOString() : "");
                      trigger(["startDate", "endDate", "endTime"]);
                      setValue(
                        "duration",
                        getDurationText(...getValues(["startDate", "startTime", "endDate", "endTime"]))
                      );
                    }}
                    data-invalid={fieldState.invalid}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {isRecurring === "false" && (
            <FormField
              control={control}
              name="endDate"
              render={({ field, fieldState }) => (
                <FormItem className="col-span-1 row-4">
                  <div className="flex gap-2">
                    {fieldState.invalid ? (
                      <FormMessage className="leading-none font-medium" />
                    ) : (
                      <FormLabel htmlFor="endDate">End Date</FormLabel>
                    )}
                  </div>

                  <FormControl>
                    <SingleDayPicker
                      id="endDate"
                      disabled={isReadOnly}
                      value={field.value ? new Date(field.value) : new Date()}
                      onSelect={(date) => {
                        if (isRecurring !== "false") {
                          setValue("startDate", date ? date.toISOString() : "");
                        }
                        field.onChange(date ? date.toISOString() : "");

                        trigger(["startDate", "endTime", "startTime"]);
                        setValue(
                          "duration",
                          getDurationText(...getValues(["startDate", "startTime", "endDate", "endTime"]))
                        );
                      }}
                      placeholder="Select a date"
                      data-invalid={fieldState.invalid}
                      className="min-w-52"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={control}
            name="endTime"
            render={({ field, fieldState }) => (
              <FormItem className="col-span-1 col-start-2 row-4">
                <FormControl>
                  <TimePicker
                    id="endTime"
                    disabled={isReadOnly}
                    date={field.value ? new Date(field.value) : new Date()}
                    setDate={(date) => {
                      field.onChange(date ? date.toISOString() : "");

                      trigger(["startDate", "endDate", "startTime"]);
                      setValue(
                        "duration",
                        getDurationText(...getValues(["startDate", "startTime", "endDate", "endTime"]))
                      );
                    }}
                    data-invalid={fieldState.invalid}
                  />
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
                  <FormLabel htmlFor="duration">Duration:</FormLabel>
                )}
                <FormControl>
                  <Input
                    id="duration"
                    disabled={isReadOnly}
                    className="text-sm h-9 px-3 py-1 content-center"
                    defaultValue={field.value}
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

export const getDurationText = (startDate: string, startTime: string, endDate: string, endTime: string): string => {
  const startDateTime = combineDateTime(new Date(startDate), new Date(startTime));
  const endDateTime = combineDateTime(new Date(endDate), new Date(endTime));

  const duration = formatDuration(intervalToDuration({ start: startDateTime, end: endDateTime }), {
    format: ["years", "months", "days", "hours", "minutes"],
    delimiter: ", ",
  });

  return duration.length === 0 ? "0 Minutes" : duration;
};

/*<div className="flex flex-col gap-3">
      
        /*<div>
        <Input {...register("email")} placeholder="Email" />
        <Input {...register("firstName")} placeholder="First Name" />
        <Input {...register("lastName")} placeholder="Last Name" />
      </div>
      <NextButton onClick={handleStepSubmit} />
    </div>*/
