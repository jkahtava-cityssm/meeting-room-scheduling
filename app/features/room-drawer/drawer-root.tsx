import { HomeIcon, UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";

import { IRoom, SRoom } from "@/lib/schemas";
import React, { useMemo } from "react";

import { step1Schema } from "./drawer-schema.validator";
import { MultiStepForm } from "./drawer-form-provider";
import { Step01Room } from "./drawer-step-room-details";

export default function RoomDrawer({
  room,
  isOpen,
  onOpen,
  onClose,
}: {
  room?: IRoom;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const formSteps: FormStep[] = [
    {
      title: "Step 1: Room Details",
      component: Step01Room,
      icon: UserIcon,
      position: 1,
      validationSchema: step1Schema,
      fields: Object.keys(step1Schema.shape) as FieldKeys[],
    },
  ];

  const parsedRoom = useMemo(() => {
    if (!room) return undefined;
    return SRoom.parse(room);
  }, [room]);

  return (
    <MultiStepForm
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      formSteps={formSteps}
      room={parsedRoom}
    ></MultiStepForm>
  );
}
