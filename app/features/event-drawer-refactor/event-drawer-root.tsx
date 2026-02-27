import { HomeIcon, UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";

import { IEvent, SEvent } from "@/lib/schemas/calendar";
import React from "react";
import { Step1 } from "./step-event-details";
import { Step2 } from "./step-event-recurrence";

import { step1Schema, Step2Fields, step2Schema } from "./event-drawer-schema.validator";
import { MultiStepForm } from "./multi-step-form-shell";

export default function EventDrawer({
  creationDate,
  event,
  userId,
  roomId,
  children,
}: {
  creationDate?: Date;
  event?: IEvent;
  userId?: string;
  roomId?: number;
  children: React.ReactNode;
}) {
  const checkoutSteps: FormStep[] = [
    {
      title: "Step 1: Event Details",
      component: Step1,
      icon: UserIcon,
      position: 1,
      validationSchema: step1Schema,
      fields: Object.keys(step1Schema.shape) as FieldKeys[],
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
    <>
      <MultiStepForm
        creationDate={creationDate}
        formSteps={checkoutSteps}
        event={event ? SEvent.parse(event) : undefined}
        userId={userId}
      >
        {children}
      </MultiStepForm>
    </>
  );
}
