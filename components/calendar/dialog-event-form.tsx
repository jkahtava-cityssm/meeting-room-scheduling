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
import { Switch } from "../ui/switch";

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
    startTime: z.date(),
    endTime: z.date(),
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

export function UpdateEventForm({
  isLoading,
  event,
  rooms,
  onSubmit,
}: {
  isLoading: boolean;
  event?: IEventForm;
  rooms?: IRoom[];
  onSubmit: (values: IEventForm) => Promise<void>;
}) {
  const form = useForm<IEventForm>({
    resolver: zodResolver(SEventForm),
    reValidateMode: "onChange",
    mode: "all",
    defaultValues: {
      roomId: event ? event.roomId : 0,
      title: event ? event.title : "",
      description: event ? event.description : "",
      startDate: event ? event.startDate : new Date(),
      endDate: event ? event.endDate : new Date(),
      startTime: event ? event.startDate : new Date(),
      endTime: event ? event.endDate : new Date(),
      duration: getDurationText(new Date(), new Date(), new Date(), new Date()),
      isRecurring: false,
    },
  });

  if (isLoading) {
    return <EditEventSkeleton></EditEventSkeleton>;
  }

  return (
    <Form {...form}>
      <form id="event-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex flex-col flex-1 gap-4 py-4">
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
                      <SelectTrigger id={field.name} data-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>

                      <SelectContent>
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
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <FormItem className="pr-11">
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

            <div className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <FormItem className="flex-1">
                    <div className="flex gap-2">
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
                        className="min-w-49"
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

            <div className="flex items-start gap-2">
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
                        className="min-w-49"
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
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field, fieldState }) => (
                <FormItem className="pr-11">
                  {fieldState.invalid ? (
                    <FormMessage className="leading-none font-medium" />
                  ) : (
                    <FormLabel htmlFor="isRecurring">Make Recurring</FormLabel>
                  )}
                  <FormControl>
                    <Switch
                      id="isRecurring"
                      checked={field.value}
                      data-invalid={fieldState.invalid}
                      //value={field.value}
                      onChange={field.onChange}
                    />
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
                      className="max-h-83 min-h-83 resize-none"
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
      </form>
    </Form>
  );
}
