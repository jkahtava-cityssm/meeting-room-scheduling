import { IEvent } from "@/calendar/interfaces";
import { eventSchema, TEventFormData } from "@/calendar/schemas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay, parseISO } from "date-fns";
import { Clock, MapPin, Text } from "lucide-react";
import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateEvent } from "@/calendar/hooks/use-update-event";

import { BookKey } from "lucide-react";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function EditEvent({ event }: { event: IEvent }) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const { rooms } = useCalendar();

  const { updateEvent } = useUpdateEvent();

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      room: event.room.id,
      title: event.title,
      description: event.description,
      startDate: parseISO(event.startDate),
      startTime: parseISO(event.startDate),
      /*startTime: {
        hour: parseISO(event.startDate).getHours(),
        minute: parseISO(event.startDate).getMinutes(),
      },*/
      endDate: parseISO(event.endDate),
      endTime: parseISO(event.endDate),
      /*endTime: {
        hour: parseISO(event.endDate).getHours(),
        minute: parseISO(event.endDate).getMinutes(),
      },*/
      color: event.room.color,
    },
  });

  const onSubmit = (values: TEventFormData) => {
    const room = rooms.find((room) => room.id === values.room);

    if (!room) throw new Error("User not found");

    const startDateTime = new Date(values.startDate);
    startDateTime.setHours(values.startTime.getHours(), values.startTime.getMinutes());

    const endDateTime = new Date(values.endDate);
    endDateTime.setHours(values.endTime.getHours(), values.endTime.getMinutes());

    updateEvent({
      ...event,
      room,
      title: values.title,
      description: values.description,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="room"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Room</FormLabel>

              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id} className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookKey color={room.color}></BookKey>
                        <p className="truncate">{room.name}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormItem>
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
                    onSelect={(date) => field.onChange(date as Date)}
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
                  <TimePicker date={field.value} setDate={field.onChange} />

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

        <div className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="endDate"
            render={({ field, fieldState }) => (
              <FormItem className="flex-1">
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <SingleDayPicker
                    value={field.value}
                    onSelect={(date) => field.onChange(date as Date)}
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
                  <TimePicker date={field.value} setDate={field.onChange} />
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
          name="description"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <ScrollArea className="h-[25vh]" type="always">
                <FormControl>
                  <Textarea {...field} value={field.value} data-invalid={fieldState.invalid} />
                </FormControl>
              </ScrollArea>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
