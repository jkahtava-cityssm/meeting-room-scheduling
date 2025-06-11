"use client";

import { eventSchema, TEventFormData } from "@/lib/schemas";
import { formatDuration, intervalToDuration } from "date-fns";

import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { BookKey } from "lucide-react";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SetStateAction, useEffect } from "react";
import { IconColored } from "@/components/ui/icon-colored";
import { Label } from "@radix-ui/react-dropdown-menu";
import { TColors } from "@/lib/types";
import { Button } from "@/components/ui/button";

import { IRoom } from "@/lib/schemas/calendar";

import { EditEventSkeleton } from "./skeleton-dialog-edit-event";
import { useEvent } from "@/hooks/use-events";
import { useRooms } from "@/hooks/use-rooms";

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

export function EditEvent({
  eventId,
  setIsEditable,
  setTitle,
}: {
  eventId: number;
  setIsEditable: (value: SetStateAction<boolean>) => void;
  setTitle: (value: SetStateAction<string>) => void;
}) {
  /*const rooms = [
    { roomId: 5, name: "T", color: "red" },
    { roomId: 10, name: "C", color: "blue" },
  ];*/
  //const [isLoading, setLoading] = useState(true);
  const { isLoading: isEventLoading, event } = useEvent(eventId);
  const { isLoading: isRoomLoading, rooms } = useRooms();

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    reValidateMode: "onChange",
    mode: "all",
    defaultValues: {
      room: 0,
      title: "",
      description: "",
      startDate: new Date(),
      startTime: new Date(),
      endDate: new Date(),
      endTime: new Date(),
      duration: "",
    },
  });

  const { setValue } = form;

  const onSubmit = async (values: TEventFormData) => {
    const room = rooms?.find((room) => room.roomId === values.room);

    if (!room) throw new Error("Room not found");
  };

  useEffect(() => {
    if (event && rooms) {
      setTitle("Edit: " + event.title);
      setValue("room", event.roomId);
      setValue("title", event.title);
      setValue("description", event.description);
      setValue("startDate", event.startDate);
      setValue("startTime", event.startDate);
      setValue("endDate", event.endDate);
      setValue("endTime", event.endDate);
      setValue("duration", getDurationText(event.startDate, event.startDate, event.endDate, event.endDate));
      setValue("color", event.room.color);
    }
  }, [event, rooms, setValue, setTitle]);

  if (isEventLoading || isRoomLoading) {
    return <EditEventSkeleton></EditEventSkeleton>;
  }

  return (
    <>
      <Form {...form}>
        <form id="event-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex flex-col flex-1 gap-4 py-4">
              {
                <FormField
                  control={form.control}
                  name="room"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel id="roomLabel" htmlFor="room">
                        Room
                      </FormLabel>
                      <FormControl>
                        <Select
                          //{...field}
                          name={field.name}
                          value={field.value.toString()}
                          defaultValue={field.value.toString()}
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
                                    <IconColored
                                      color={room.color as TColors}
                                      showBorder={false}
                                      hideBackground={false}
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
              }

              <FormField
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <FormItem className="pr-11">
                    <FormLabel htmlFor="title">Title</FormLabel>

                    <FormControl>
                      <Input
                        id="title"
                        placeholder="Enter a title"
                        data-invalid={fieldState.invalid}
                        value={field.value}
                        onChange={field.onChange}
                      />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="max-h-100 resize-none"
                        {...field}
                        value={field.value}
                        data-invalid={fieldState.invalid}
                      ></Textarea>
                    </FormControl>
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
