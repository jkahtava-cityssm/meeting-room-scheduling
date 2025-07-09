"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { IEventForm, UpdateEventForm } from "./dialog-event-form-step-1";
import { IRecurrenceForm, UpdateRecurrenceForm } from "./dialog-event-form-step-2";
import { useRooms } from "@/hooks/use-rooms";
import { isEmpty } from "lodash";

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
  AlertDialogSave,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { useEventForm } from "@/contexts/EventFormProvider";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { title } from "process";
import { description } from "@/app/(private)/layout";
import { addYears, endOfDay } from "date-fns";
import z from "zod/v4";

const SubmitSchemaEvent = z.object({
  roomId: z.number(),
  description: z.string(),
  title: z.string(),
  startDate: z.date(),
  endDate: z.date(),
});

const SubmitSchemaRecurrence = z.object({
  rule: z.string(),
  ruleStartDate: z.date(),
  ruleEndDate: z.date(),
});

async function sendPOSTRequest(url, { arg }) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(arg),
  });
}

export function EventFormWizard({
  children,
  defaultStartDate,
}: {
  children: React.ReactNode;
  defaultStartDate?: Date;
}) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const [showAlert, setShowAlert] = useState(false);

  const { isLoading: isRoomLoading, rooms } = useRooms();
  //const currentStep = useFormStore((state) => state.currentStep);

  const { data, error, trigger: triggerEvent } = useSWRMutation("/api/events", sendPOSTRequest);

  const {
    isBackVisible,
    isNextVisible,
    currentForm,
    formId,
    currentStep,
    incrementStep,
    decrementStep,
    getKeyData,
    setFormData,
    getStepData,
    resetForm,
    isDirtyRef,
    isValidSchema,
  } = useEventForm();
  //const { setCurrentStep, setFormStoreData, getLatestState } = useFormStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <UpdateEventForm
            defaultStartDate={defaultStartDate}
            isLoading={isRoomLoading}
            rooms={rooms}
            onSubmit={onNext}
          ></UpdateEventForm>
        );

      case 2:
        const startDate = getKeyData(1, "startDate");
        //setKeyData("startDate", "2000-01-01", 2);
        return (
          <UpdateRecurrenceForm
            isLoading={false}
            onSubmit={onNext}
            defaultStartDate={startDate ? new Date(startDate) : new Date()}
          />
        );
      default:
        return <div>Step {currentStep} coming soon...</div>;
    }
  };

  const onBack = (data: object) => {
    if (!currentForm) return;
    setFormData(data);
    decrementStep();
  };

  const onNext = async (data: object) => {
    if (!currentForm) return;
    setFormData(data);

    if (isNextVisible) {
      incrementStep();
    } else {
      const stepOne = getStepData(1) as IEventForm;
      const eventObject = {
        roomId: stepOne.roomId,
        startDate: stepOne.startDate,
        endDate: stepOne.endDate,
        title: stepOne.title,
        description: stepOne.description,
      };

      if (!isValidSchema(SubmitSchemaEvent, eventObject)) return;

      if (currentStep == 2) {
        const stepTwo = getStepData(2) as IRecurrenceForm;

        const ruleObject = {
          rule: stepTwo.rule,
          ruleStartDate: stepTwo.startDate,
          ruleEndDate:
            stepTwo.durationType === "until"
              ? stepTwo.endDate
              : stepTwo.durationType === "count"
              ? stepTwo.lastOccurrenceDate
              : addYears(new Date(stepOne.startDate), 200),
        };

        if (!isValidSchema(SubmitSchemaRecurrence, ruleObject)) return;

        const result = await triggerEvent({ ...eventObject, ...ruleObject });
        if (result.status === 201) {
          resetForm();
          onClose();
        }

        //const ruleEndDate = triggerEvent();
      } else {
        const result = await triggerEvent({ ...eventObject });
        if (result.status === 201) {
          resetForm();
          onClose();
        }

        //triggerEvent({ ...eventObject });
      }
    }
  };

  const onOpenChange = (open: boolean) => {
    if (open === false && (isDirtyRef.current || currentStep > 1)) {
      setShowAlert(true);
    } else {
      onToggle();
    }
  };

  const onSaveReturn = (data: object) => {
    setFormData(data);
    onClose();
    setShowAlert(false);
  };

  const onDiscardChanges = () => {
    onClose();
    setShowAlert(false);
    resetForm();
  };

  /*useEffect(() => {
    const value = currentForm?.formState.isDirty;
    const test = value ? value : false;
    setDirty(value ? value : false);
  }, [currentForm?.formState.isDirty, setDirty]);
*/
  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
      <AlertDialog open={showAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Event Cancellation </AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogSave onClick={() => onSaveReturn(currentForm?.getValues())} className="sm:mr-auto">
              Save for later
            </AlertDialogSave>
            <AlertDialogAction
              onClick={onDiscardChanges}
              className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
            >
              Dismiss Form
            </AlertDialogAction>

            <AlertDialogCancel onClick={() => setShowAlert(false)}>Continue Editing</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
