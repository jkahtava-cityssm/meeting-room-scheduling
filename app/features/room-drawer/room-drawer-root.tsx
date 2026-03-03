import { HomeIcon, UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";

import { IRoom, SRoom } from "@/lib/schemas/calendar";
import React from "react";

import { step1Schema } from "./room-drawer-schema.validator";
import { RoomMultiStepForm } from "./room-multi-step-form-shell";
import { Step01Room } from "./step-01-room";

export default function RoomDrawer({
  creationDate,
  room,
  userId,
  roomId,
  children,
}: {
  creationDate?: Date;
  room?: IRoom;
  userId?: string;
  roomId?: number;
  children: React.ReactNode;
}) {
  const checkoutSteps: FormStep[] = [
    {
      title: "Step 1: Room Details",
      component: Step01Room,
      icon: UserIcon,
      position: 1,
      validationSchema: step1Schema,
      fields: Object.keys(step1Schema.shape) as FieldKeys[],
    },
  ];

  return (
    <>
      <RoomMultiStepForm
        creationDate={creationDate}
        formSteps={checkoutSteps}
        room={room ? SRoom.parse(room) : undefined}
      >
        {children}
      </RoomMultiStepForm>
    </>
  );
}
