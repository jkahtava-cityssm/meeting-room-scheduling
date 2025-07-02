"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useDisclosure } from "@/hooks/use-disclosure";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
//import { TimeInput } from "@/components/ui/time-input";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { eventSchema } from "@/lib/schemas";

//import type { TimeValue } from "react-aria-components";
import type { TEventFormData } from "@/lib/schemas";
import { addMinutes, set } from "date-fns";
import { getDurationText } from "@/lib/helpers";
import { useRooms } from "@/hooks/use-rooms";

import { EventFormWizard } from "./dialog-event-form-wizard";

import { EventFormProvider, useEventForm } from "@/contexts/EventFormProvider";

export function AddEventDrawer({
  children,
  startDate,
  startTime,
}: {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
}) {
  const { isLoading: isRoomLoading, rooms } = useRooms();

  const defaultStartDate = startDate ? startDate : new Date();
  const defaultStartDateTime = startTime
    ? set(defaultStartDate, { hours: startTime.hour, minutes: startTime.minute })
    : defaultStartDate;

  const defaultEndDateTime = addMinutes(defaultStartDateTime, 30);

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    reValidateMode: "onChange",
    mode: "all",
    defaultValues: {
      room: 0,
      title: "",
      description: "",
      startDate: defaultStartDateTime,
      startTime: defaultStartDateTime,
      endDate: defaultEndDateTime,
      endTime: defaultEndDateTime,
      duration: getDurationText(defaultStartDateTime, defaultStartDateTime, defaultEndDateTime, defaultEndDateTime),
    },
  });

  /*const onSubmit = (_values: TEventFormData) => {
    // TO DO: Create use-add-event hook
    onClose();
    form.reset();
  };*/

  //const { isBackVisible, isNextVisible, isSubmitVisible } = useEventForm();

  return (
    <EventFormProvider>
      <EventFormWizard>{children}</EventFormWizard>
    </EventFormProvider>
  );
}
