"use client";

import React, { Children, useState } from "react";
import { Button } from "../ui/button";
import { IEventForm, UpdateEventForm } from "./dialog-event-form-step-1";
import { UpdateRecurrenceForm } from "./dialog-event-form-step-2";
import { useFormStore } from "@/lib/zustand/event-store";
import { useRooms } from "@/hooks/use-rooms";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

export function EventFormWizard() {
  const { isLoading: isRoomLoading, rooms } = useRooms();
  const currentStep = useFormStore((state) => state.currentStep);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <UpdateEventForm
            isLoading={isRoomLoading}
            rooms={rooms}
            onSubmit={function (values: IEventForm): Promise<void> {
              throw new Error("Function not implemented.");
            }}
            toggleRecurrence={function (value: React.SetStateAction<boolean>): void {
              throw new Error("Function not implemented.");
            }}
          ></UpdateEventForm>
        );

      case 2:
        return <UpdateRecurrenceForm isLoading={false} />;
      default:
        return <div>Step {currentStep} coming soon...</div>;
    }
  };

  return <>{renderStep()}</>;
}
/*
 <div className="flex gap-2 sm:flex-col-reverse md:flex-row md:justify-end ">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">Continue</Button>
      </div>
*/
