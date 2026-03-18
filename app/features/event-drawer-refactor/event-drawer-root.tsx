import { HomeIcon, UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";

import { IEvent, SEvent } from "@/lib/schemas/calendar";
import React from "react";
import { Step1 } from "./step-event-details";
import { Step2 } from "./step-event-recurrence";

import { getStep1Schema, Step2Fields, step2Schema } from "./event-drawer-schema.validator";
import { MultiStepForm } from "./multi-step-form-shell";
import { EventDrawerPermissions } from "./lib/permissions";
import { useSession } from "@/contexts/SessionProvider";
import { usePrivateConfigurationQuery } from "@/lib/services/configuration";
import { TimeInterval } from "@/components/calendar-time-picker/useTimePicker";

export default function EventDrawerRefactor({
  creationDate,
  event,
  userId,
  roomId,
  isOpen,
  onOpenChange,
}: {
  creationDate: Date;
  event?: IEvent;
  userId?: string;
  roomId?: number;
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { data: config } = usePrivateConfigurationQuery([
    "visibleHoursStart",
    "visibleHoursEnd",
    "timeSlotInterval",
    "maxBookingSpan",
  ]);

  const { can } = EventDrawerPermissions.usePermissions();

  const minHour = config?.visibleHoursStart ?? 0;
  const maxHour = config?.visibleHoursEnd ?? 24;
  const interval = (config?.timeSlotInterval ?? 30) as TimeInterval;
  const maxSpan = config?.maxBookingSpan ?? 0;

  const restrictHours = !can("IgnoreHours");

  const checkoutSteps: FormStep[] = [
    {
      title: "Step 1: Event Details",
      component: Step1,
      icon: UserIcon,
      position: 1,
      validationSchema: getStep1Schema(minHour, maxHour, restrictHours),
      fields: Object.keys(getStep1Schema(minHour, maxHour, restrictHours).shape) as FieldKeys[],
    },
    {
      title: "Step 2: Recurrence",
      component: Step2,
      icon: HomeIcon,
      position: 2,
      validationSchema: step2Schema,
      fields: Object.keys(Step2Fields) as FieldKeys[],
    },
  ];

  return (
    <MultiStepForm
      isOpen={isOpen} // Pass it down
      onOpenChange={onOpenChange} // Pass it down
      creationDate={creationDate}
      formSteps={checkoutSteps}
      event={event ? SEvent.parse(event) : undefined}
      userId={userId}
      roomId={roomId}
      minHour={minHour}
      maxHour={maxHour}
      interval={interval}
      maxSpan={maxSpan}
    ></MultiStepForm>
  );
}
