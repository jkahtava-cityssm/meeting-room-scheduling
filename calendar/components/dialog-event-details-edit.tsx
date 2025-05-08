import { IEvent, IRoom } from "@/calendar/interfaces";
import { eventSchema, TEventFormData } from "@/calendar/schemas";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  formatDistance,
  formatDistanceStrict,
  formatDuration,
  intervalToDuration,
  parseISO,
} from "date-fns";
import { Clock, MapPin, Text } from "lucide-react";
import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { BookKey } from "lucide-react";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SetStateAction, useState } from "react";
import { IconColored } from "@/components/ui/icon-colored";
import { Label } from "@radix-ui/react-dropdown-menu";
import { fi } from "date-fns/locale";
import { startTask } from "better-auth/react";
import { TColors } from "@/calendar/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditEventSkeleton } from "./skeleton-dialog-edit-event";
import { updateEvent } from "@/services/events";

export function EditEvent({
  event,
  rooms,
  fetchData,
  setIsEditable,
}: {
  event: IEvent;
  rooms: IRoom[];
  fetchData: () => Promise<void>;
  setIsEditable: (value: SetStateAction<boolean>) => void;
}) {
  const startDate = event.startDate;
  const endDate = event.endDate;

  const getDurationText = (startDate: Date, startTime: Date, endDate: Date, endTime: Date): string => {
    const startDateTime = combineDateTime(startDate, startTime);
    const endDateTime = combineDateTime(endDate, endTime);

    return formatDuration(intervalToDuration({ start: startDateTime, end: endDateTime }), {
      format: ["years", "months", "days", "hours", "minutes"],
      delimiter: ", ",
    });
  };

  const combineDateTime = (dateField: Date, timeField: Date) => {
    return new Date(dateField.setHours(timeField.getHours(), timeField.getMinutes()));
  };

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    reValidateMode: "onChange",
    mode: "all",
    defaultValues: {
      room: event.roomId,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      startTime: event.startDate,
      /*startTime: {
        hour: parseISO(event.startDate).getHours(),
        minute: parseISO(event.startDate).getMinutes(),
      },*/
      endDate: event.endDate,
      endTime: event.endDate,
      duration: getDurationText(event.startDate, event.startDate, event.endDate, event.endDate),
      /*endTime: {
        hour: parseISO(event.endDate).getHours(),
        minute: parseISO(event.endDate).getMinutes(),
      },*/
      color: event.room.color,
    },
  });

  const onSubmit = async (values: TEventFormData) => {
    const room = rooms.find((room) => room.roomId === values.room);

    if (!room) throw new Error("User not found");

    const startDateTime = combineDateTime(values.startDate, values.startTime);
    const endDateTime = combineDateTime(values.endDate, values.endTime);
    //new Date(values.startDate);
    //startDateTime.setHours(values.startTime.getHours(), values.startTime.getMinutes());

    //const endDateTime = new Date(values.endDate);
    //endDateTime.setHours(values.endTime.getHours(), values.endTime.getMinutes());
    const test = await updateEvent({
      ...event,
      roomId: room.roomId,
      title: values.title,
      description: values.description,
      startDate: startDateTime,
      endDate: endDateTime,
    });

    fetchData();
    /*updateEvent({
      ...event,
      room,
      title: values.title,
      description: values.description,
      startDate: startDateTime,
      endDate: endDateTime,
    });*/
  };
  /*
  const onTest = (value: string) => {
    console.log(value);
  };
*/

  return (
    <>
      <Form {...form}>
        <form id="event-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex flex-col flex-1 gap-4 py-4">
              <FormField
                control={form.control}
                name="room"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel id="roomLabel" htmlFor="room">
                      Room
                    </FormLabel>
                    <FormControl>
                      <Select name={field.name} value={field.value.toString()} onValueChange={field.onChange}>
                        <SelectTrigger id={field.name} data-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.roomId} value={room.roomId.toString()} className="flex-1">
                              <div className="flex items-center gap-2">
                                <IconColored
                                  color={room.color as TColors}
                                  showBorder={false}
                                  children={<BookKey />}
                                  hideBackground={false}
                                />

                                <p className="truncate">{room.name}</p>
                              </div>
                            </SelectItem>
                          ))}
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
                    <FormLabel htmlFor="title">Title</FormLabel>

                    <FormControl>
                      <Input id="title" placeholder="Enter a title" data-invalid={fieldState.invalid} {...field} />
                    </FormControl>

                    <FormMessage />
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
                        {/*<TimeInput
                        value={field.value as TimeValue}
                        onChange={field.onChange}
                        hourCycle={12}
                        data-invalid={fieldState.invalid}
                      />*/}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="duration"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Duration:</FormLabel>

                    <FormControl>
                      <Label className="text-sm h-9 px-3 py-1 content-center" id="duration" {...field}>
                        {field.value}
                      </Label>
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
                    <FormLabel>Description</FormLabel>

                    {
                      //<ScrollArea className="h-[25vh]" type="always">
                    }
                    <FormControl>
                      <Textarea
                        className="max-h-100 resize-none"
                        {...field}
                        value={field.value}
                        data-invalid={fieldState.invalid}
                      ></Textarea>
                    </FormControl>
                    {
                      //</ScrollArea>
                    }

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex gap-2 sm:flex-col-reverse md:flex-row md:justify-end ">
            <Button form="event-form" type="submit">
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditable(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
