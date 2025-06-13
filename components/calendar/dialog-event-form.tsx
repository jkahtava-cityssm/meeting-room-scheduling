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

export interface IEventForm extends Pick<IEvent, "roomId" | "description" | "title" | "startDate" | "endDate"> {
  duration: string;
  startTime: Date;
  endTime: Date;
}

const SEventForm = z
  .object({
    ...SEvent.pick({ roomId: true, description: true, title: true, startDate: true, endDate: true }).shape,
    duration: z.string(),
    startTime: z.date(),
    endTime: z.date(),
  })
  .check((ctx) => {
    const EndDate = new Date(ctx.value.endDate.toDateString());
    const StartDate = new Date(ctx.value.startDate.toDateString());

    const EndTime = new Date(
      ctx.value.startDate.setHours(ctx.value.endTime.getHours(), ctx.value.endTime.getMinutes())
    );
    const StartTime = new Date(
      ctx.value.startDate.setHours(ctx.value.startTime.getHours(), ctx.value.startTime.getMinutes())
    );

    if (EndDate < StartDate) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startDate"],
        message: "Start Date occurs after End Date",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endDate"],
        message: "End Date occurs before Start Date",
      });
    }
    console.log(EndTime < StartTime && EndDate === StartDate);
    console.log(EndTime < StartTime);
    console.log(EndDate.getTime() === StartDate.getTime());
    if (EndTime < StartTime && EndDate === StartDate) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startTime"],
        message: "Start Time occurs after End Time",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endTime"],
        message: "End Time occurs before Start Time",
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
                                <IconColored color={room.color as TColors} showBorder={false} hideBackground={false}>
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
                    <FormLabel htmlFor="startDate">Start Date</FormLabel>

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
                      />
                    </FormControl>

                    <FormMessage />
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

                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.startDate ? "BBBBB" : "FFFFF"}
            </div>

            <div className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field, fieldState }) => (
                  <FormItem className="flex-1">
                    <FormLabel htmlFor="endDate">End Date</FormLabel>
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
                      />
                    </FormControl>
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="duration">Duration:</FormLabel>

                  <FormControl>
                    <Input
                      id="duration"
                      className="text-sm h-9 px-3 py-1 content-center"
                      {...field}
                      value={field.value}
                      readOnly
                    ></Input>
                  </FormControl>
                  <FormMessage />
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
