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
import { BookKey } from "lucide-react";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form";
import { IconColored } from "../ui/icon-colored";
import { ScrollBar } from "../ui/scroll-area";
import { SingleDayPicker } from "../ui/single-day-picker";
import { Textarea } from "../ui/textarea";
import { useRoomsQuery } from "@/services/rooms";
import { TimePicker } from "../ui/time-picker";
import { Select } from "../ui/select";
import { useImperativeHandle } from "react";

import { ForwardedRef } from "react";
import { combineDateTime } from "@/lib/helpers";
import { format, formatDuration, intervalToDuration } from "date-fns";

export const Step1 = ({ ref }: { ref: ForwardedRef<any> }) => {
  const {
    control,
    getValues,
    setValue,
    trigger,
    setError,
    formState: { errors },
    watch,
  } = useFormContext<z.infer<typeof step1Schema>>();

  const { data: rooms } = useRoomsQuery(false);

  const isReadOnly = false;
  const isRecurring = watch("isRecurring");

  return (
    <ScrollArea type="always">
      <div className="max-h-[calc(80dvh)] w-full">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col flex-1 gap-4 py-4">
            <div className="flex flex-col xs:flex-row items-start gap-4">
              <FormField
                control={control}
                name="roomId"
                render={({ field, fieldState }) => (
                  <FormItem>
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
                  <FormItem className="xs:justify-items-center">
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

                          if (isRecurring === "true" && startDate !== endDate) {
                            setValue("endDate", getValues("startDate"));
                            setValue(
                              "duration",
                              getDurationText(...getValues(["startDate", "startTime", "endDate", "endTime"]))
                            );
                          }
                          field.onChange(value);
                        }}
                      >
                        <TabsList className="gap-2" data-invalid={fieldState.invalid} aria-invalid={fieldState.invalid}>
                          <TabsTrigger value="false" disabled={isReadOnly}>
                            One Time
                          </TabsTrigger>
                          <TabsTrigger value="true" disabled={isReadOnly}>
                            Multiple/Recurring
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem className="max-w-90 xs:w-auto">
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

            <div className="flex flex-col xs:flex-row items-start gap-4">
              <FormField
                control={control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <FormItem className="flex-1">
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
                            setValue("endDate", date ? format(date, "yyyy-MM-dd") : "");
                          }

                          field.onChange(date ? format(date, "yyyy-MM-dd") : "");

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
                  <FormItem className="flex-1">
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
            </div>

            <div className="flex flex-col  xs:flex-row items-start gap-4">
              <FormField
                control={control}
                name="endDate"
                render={({ field, fieldState }) => (
                  <FormItem className="flex-1">
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
                          if (isRecurring === "true") {
                            setValue("startDate", date ? format(date, "yyyy-MM-dd") : "");
                          }
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "");

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

              <FormField
                control={control}
                name="endTime"
                render={({ field, fieldState }) => (
                  <FormItem className="flex-1">
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
            </div>
            <FormField
              control={control}
              name="duration"
              render={({ field, fieldState }) => (
                <FormItem>
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
                      {...field}
                      value={field.value}
                      data-invalid={fieldState.invalid}
                      readOnly
                    ></Input>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col flex-1 gap-4 py-4">
            <FormField
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
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
        </div>
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
