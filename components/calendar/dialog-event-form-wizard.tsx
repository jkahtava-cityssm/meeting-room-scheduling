"use client";

import React, { Children, useState } from "react";
import { Button } from "../ui/button";
import { IEventForm, UpdateEventForm } from "./dialog-event-form-step-1";
import { UpdateRecurrenceForm } from "./dialog-event-form-step-2";
import { useFormStore } from "@/lib/zustand/event-store";
import { useRooms } from "@/hooks/use-rooms";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { EventFormProvider, useEventForm } from "@/contexts/EventFormProvider";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

export function EventFormWizard({ children }: { children: React.ReactNode }) {
  const { isOpen, onClose, onToggle } = useDisclosure();

  const { isLoading: isRoomLoading, rooms } = useRooms();
  //const currentStep = useFormStore((state) => state.currentStep);

  const { isBackVisible, isNextVisible, currentForm, formId, currentStep, handleNext, handleBack, getKeyData } =
    useEventForm();
  //const { setCurrentStep, setFormStoreData, getLatestState } = useFormStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UpdateEventForm isLoading={isRoomLoading} rooms={rooms} onSubmit={onNext}></UpdateEventForm>;

      case 2:
        const startDate = getKeyData(1, "startDate");

        return (
          <UpdateRecurrenceForm
            isLoading={false}
            onSubmit={onNext}
            startDate={startDate ? new Date(startDate) : new Date()}
          />
        );
      default:
        return <div>Step {currentStep} coming soon...</div>;
    }
  };

  const onBack = (data: object) => {
    //e.preventDefault();
    console.log("BACK BUTTON");
    if (!currentForm) return;
    handleBack(data);

    //setFormStoreData(currentForm.getValues(), currentStep);
    //setCurrentStep(currentStep - 1);
  };

  const onNext = (data: object) => {
    //e.preventDefault();

    if (!currentForm) return;

    if (isNextVisible) {
      console.log("NEXT BUTTON");
      handleNext(data);
      //setFormStoreData(currentForm.getValues(), currentStep);
      //setCurrentStep(currentStep + 1);
    } else {
      console.log("FINAL SUBMIT");

      //currentForm.handleSubmit(currentForm.getValues);
    }
  };

  //return <>{renderStep()}</>;

  console.log("RE-RENDER");
  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent className="w-full md:w-4xl p-4">
        <SheetHeader>
          <SheetTitle>{currentStep === 1 ? "Create Event/Appointment" : "Set Reccurrence Pattern"}</SheetTitle>
          <SheetDescription>
            This form will add an event/appointment to the calendar for the given room and assign it to an individual.
          </SheetDescription>
        </SheetHeader>
        {renderStep()}

        <SheetFooter className="flex sm:flex-col-reverse md:flex-row md:justify-end gap-6 ">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-destructive accent-destructive"
                onClick={() => {}}
              >
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Do you want to discard your changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will delete all the content entered into this form.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>

                <SheetClose asChild>
                  <AlertDialogAction className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60">
                    Discard Changes
                  </AlertDialogAction>
                </SheetClose>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isBackVisible && (
            <Button form={formId} type="submit" variant={"outline"} onClick={currentForm?.handleSubmit(onBack)}>
              Previous
            </Button>
          )}
          <Button form={formId} type="submit" onClick={currentForm?.handleSubmit(onNext)}>
            {isNextVisible ? "Next" : "Finish"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
/*
 <div className="flex gap-2 sm:flex-col-reverse md:flex-row md:justify-end ">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">Continue</Button>
      </div>
*/
