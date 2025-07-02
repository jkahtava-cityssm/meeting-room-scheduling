"use client";

import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BookKey } from "lucide-react";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { IconColored } from "@/components/ui/icon-colored";

import { TColors } from "@/lib/types";

import { getDurationText } from "@/lib/helpers";
import { EditEventSkeleton } from "./skeleton-dialog-edit-event";
import { IEvent, IRoom, SEvent } from "@/lib/schemas/calendar";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";

import { useEffect, useMemo } from "react";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

import { addMinutes } from "date-fns";

import { useEventForm } from "@/contexts/EventFormProvider";

export interface IEventForm extends Pick<IEvent, "roomId" | "description" | "title" | "startDate" | "endDate"> {
  duration: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
}

const SEventForm = z
  .object({
    ...SEvent.pick({ roomId: true, description: true, title: true, startDate: true, endDate: true }).shape,
    duration: z.string(),
    startTime: z.coerce.date() as unknown as z.ZodDate,
    endTime: z.coerce.date() as unknown as z.ZodDate,
    isRecurring: z.boolean(),
  })
  .check((ctx) => {
    const EndDate = new Date(ctx.value.endDate.toDateString());
    const StartDate = new Date(ctx.value.startDate.toDateString());

    const EndTime = new Date(
      ctx.value.startDate.setHours(ctx.value.endTime.getHours(), ctx.value.endTime.getMinutes())
    ).getTime();
    const StartTime = new Date(
      ctx.value.startDate.setHours(ctx.value.startTime.getHours(), ctx.value.startTime.getMinutes())
    ).getTime();

    if (EndDate < StartDate) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startDate"],
        message: "Start Date exceeds End Date",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endDate"],
        message: "End Date precedes Start Date",
      });
    }

    if (EndTime < StartTime && EndDate.getTime() === StartDate.getTime()) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startDate"],
        message: "Start Time exceeds End Time",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startTime"],
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endDate"],
        message: "End Time precedes Start Time",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endTime"],
      });
    }
  });

const SEventFormDefaults = {
  roomId: 0,
  title: "",
  description: "",
  startDate: new Date(),
  endDate: new Date(),
  startTime: new Date(),
  endTime: addMinutes(new Date(), 30),
  duration: getDurationText(new Date(), new Date(), new Date(), addMinutes(new Date(), 30)),
  isRecurring: false,
};

export function UpdateEventForm({
  isLoading,
  event,
  rooms,
  onSubmit,
}: {
  isLoading: boolean;
  event?: IEventForm;
  rooms?: IRoom[];
  onSubmit: (e: React.SyntheticEvent<EventTarget>) => void;
}) {
  const { setNextVisible, setBackVisible, setCurrentForm, setFormId, getFormData } = useEventForm();

  const defaultValues = useMemo(() => {
    return getFormData(SEventForm, SEventFormDefaults);
  }, [getFormData]);

  const form = useForm<IEventForm>({
    resolver: zodResolver(SEventForm),
    reValidateMode: "onChange",
    mode: "all",
    defaultValues: defaultValues,
  });

  const isRecurring = form.watch("isRecurring");

  useEffect(() => {
    setCurrentForm(form);
    setFormId("event-form");
  }, [form, setCurrentForm, setFormId]);

  useEffect(() => {
    if (isRecurring) {
      console.log("ISRECURRING");
      setNextVisible(true);
      setBackVisible(false);
    } else {
      setNextVisible(false);
      setBackVisible(false);
    }
  }, [isRecurring, setBackVisible, setNextVisible]);

  if (isLoading) {
    return <EditEventSkeleton></EditEventSkeleton>;
  }

  return (
    <>
      {
        //<ScrollArea type="always">
        //<div className="max-h-100 w-78 sm:w-auto ">
      }

      <Form {...form}>
        <form id="event-form">
          <ScrollArea type="always">
            <div className="max-h-[calc(80dvh)] w-full">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col flex-1 gap-4 py-4">
                  <div className="flex flex-col xs:flex-row items-start gap-4">
                    <FormField
                      control={form.control}
                      name="roomId"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel id="roomLabel" htmlFor="room">
                            Room
                          </FormLabel>
                          <FormControl>
                            <Select
                              //{...field}
                              name={field.name}
                              value={field.value === 0 ? "" : field.value.toString()}
                              defaultValue={field.value === 0 ? "" : field.value.toString()}
                              key={field.value}
                              onValueChange={(value) => {
                                if (value === "") {
                                  //There is a Bug with the Select Field when used with React Hook Form:
                                  //https://github.com/radix-ui/primitives/issues/2944
                                  //https://github.com/radix-ui/primitives/issues/3135
                                  //We can also prevent this behaviour by forcing a re-render if we add the property key={field.value}
                                  //return;
                                }
                                field.onChange(Number(value));
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
                                        <IconColored
                                          color={room.color as TColors}
                                          showBorder={false}
                                          hideBackground={true}
                                        >
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
                      control={form.control}
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
                              defaultValue={String(field.value)}
                              onValueChange={(value) => {
                                if (value.toLowerCase() === "true") {
                                  field.onChange(true);
                                } else {
                                  field.onChange(false);
                                }
                              }}
                            >
                              <TabsList
                                className="gap-2"
                                data-invalid={fieldState.invalid}
                                aria-invalid={fieldState.invalid}
                              >
                                <TabsTrigger value="false">One Time</TabsTrigger>
                                <TabsTrigger value="true">Multiple/Recurring</TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
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
                      control={form.control}
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
                              value={field.value}
                              onSelect={(date) => {
                                field.onChange(date as Date);
                                form.trigger(["endDate", "endTime", "startTime"]);
                                form.setValue(
                                  "duration",
                                  getDurationText(...form.getValues(["startDate", "startTime", "endDate", "endTime"]))
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
                      control={form.control}
                      name="startTime"
                      render={({ field, fieldState }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <TimePicker
                              id="startTime"
                              date={field.value}
                              setDate={(date) => {
                                field.onChange(date as Date);
                                form.trigger(["startDate", "endDate", "endTime"]);
                                form.setValue(
                                  "duration",
                                  getDurationText(...form.getValues(["startDate", "startTime", "endDate", "endTime"]))
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
                      control={form.control}
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
                              value={field.value}
                              onSelect={(date) => {
                                field.onChange(date as Date);
                                form.trigger(["startDate", "endTime", "startTime"]);
                                form.setValue(
                                  "duration",
                                  getDurationText(...form.getValues(["startDate", "startTime", "endDate", "endTime"]))
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
                      control={form.control}
                      name="endTime"
                      render={({ field, fieldState }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <TimePicker
                              id="endTime"
                              date={field.value}
                              setDate={(date) => {
                                field.onChange(date as Date);
                                form.trigger(["startDate", "endDate", "startTime"]);
                                form.setValue(
                                  "duration",
                                  getDurationText(...form.getValues(["startDate", "startTime", "endDate", "endTime"]))
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
                    control={form.control}
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
                    control={form.control}
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
          {/* <div className="flex gap-2 flex-col-reverse md:flex-row md:justify-end ">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">{isRecurring ? "Continue" : "Save"}</Button>
          </div>*/}
        </form>
      </Form>
      {
        //</div>
        //<ScrollBar orientation="vertical" forceMount></ScrollBar>
        //</ScrollArea>
      }
    </>
  );
}
