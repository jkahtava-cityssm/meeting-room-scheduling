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
import {
  Dialog,
  DialogHeader,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { eventSchema } from "@/lib/schemas";

//import type { TimeValue } from "react-aria-components";
import type { TEventFormData } from "@/lib/schemas";
import { addMinutes, set } from "date-fns";
import { getDurationText } from "@/lib/helpers";
import { useRooms } from "@/hooks/use-rooms";
import { IconColored } from "../ui/icon-colored";
import { BookKey } from "lucide-react";
import { TColors } from "@/lib/types";
import { TimePicker } from "../ui/time-picker";
import { IEventForm, UpdateEventForm } from "./dialog-event-form-step-1";
import { EventFormWizard } from "./dialog-event-form-wizard";
import { useState } from "react";
import { UpdateRecurrenceForm } from "./dialog-event-form-step-2";

export function AddEventDialog({
  children,
  startDate,
  startTime,
}: {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
}) {
  const { isOpen, onClose, onToggle } = useDisclosure();

  const [showRecurrence, setShowRecurrence] = useState(false);

  const { isLoading: isRoomLoading, rooms } = useRooms();

  const defaultStartDate = startDate ? startDate : new Date();
  const defaultStartDateTime = startTime
    ? set(defaultStartDate, { hours: startTime.hour, minutes: startTime.minute })
    : defaultStartDate;

  const defaultEndDateTime = addMinutes(defaultStartDateTime, 30);

  const onSubmit = async (values: IEventForm) => {
    //console.log(values);
  };
  //w-fit  sm:max-w-[calc(100%-2rem)] lg:max-w-9/12 max-h-[calc(100%-2rem)] lg:max-h-9/12"
  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="min-w-90 w-[calc(100%-2rem)] h-[calc(90dvh)] sm:max-w-[calc(100%-4rem)] xl:w-9/12 xl:max-w-9/12  lg:max-h-9/12">
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
          <DialogDescription>Create a new Calendar Event, Appointment, or Meeting</DialogDescription>
        </DialogHeader>
        {
          //<EventFormWizard></EventFormWizard>
        }
      </DialogContent>
    </Dialog>
  );
}
