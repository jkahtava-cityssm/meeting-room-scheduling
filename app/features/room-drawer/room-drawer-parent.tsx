import { HomeIcon, UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";
import { Step1 } from "./step1";
import { step1Schema, step2Schema } from "./room-drawer.validator";
import { MultiStepForm } from "./multi-step-form";
import { Step2 } from "./step2";

import { IEvent, SEvent } from "@/lib/schemas/calendar";

export default function RoomDrawer({
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
  //console.log(Object.keys(step1Schema.shape));

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
      fields: Object.keys(step2Schema.shape) as FieldKeys[],
    },
  ];

  //const events = z.array(SEvent).parse(event);

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
