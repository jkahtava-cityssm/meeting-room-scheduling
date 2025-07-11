"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { getEventDefaultValues, IEventForm, UpdateEventForm, useEventDefaultValues } from "./dialog-event-form-step-1";
import { IRecurrenceForm, UpdateRecurrenceForm } from "./dialog-event-form-step-2";
import { useRooms } from "@/hooks/use-rooms";
import { isEmpty } from "lodash";
import { SEvent } from "@/lib/schemas/calendar";

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
import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { title } from "process";
import { description } from "@/app/(private)/layout";
import { addYears, endOfDay } from "date-fns";
import z from "zod/v4";
import { IEvent } from "@/lib/schemas/calendar";

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
/**
 * TODO: I BELIEVE THE ZUSTAND STORE IS CAUSING THIS AND ALL RELATED FORMS TO RE-RENDER
 * I NEED TO MOVE THE STEP COUNTER INTO THE CONTEXT PROVIDER
 * I MIGHT ALSO NEED TO RE-WORK HOW IT STORES THE DATA BETWEEN PAGES AND MAYBE THE CONTEXT PROVIDER CAN HOLD IT TEMPORARILY
 * AND THEN EXPORT IT TO LOCAL STORAGE WHEN THE SAVE BUTTON IS CLICKED
 *
 * @param param0
 * @returns
 */
export function EventFormWizard({
  children,
  defaultStartDate,
  defaultevent,
}: {
  children: React.ReactNode;
  defaultStartDate?: Date;
  defaultevent?: IEvent;
}) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const [showAlert, setShowAlert] = useState(false);
  const [isReadOnly, setReadOnly] = useState(defaultevent ? true : false);
  const [isLoading, setLoading] = useState(false);

  //console.log(defaultevent);
  const { isLoading: isRoomLoading, rooms } = useRooms();
  //const currentStep = useFormStore((state) => state.currentStep);

  const { trigger: triggerEvent } = useSWRMutation("/api/events", sendPOSTRequest);
  const loadedEvent = useEvent(defaultevent?.eventId, !isReadOnly && defaultevent ? true : false);

  //console.log("FORM-WIZARD-RE-RENDER");
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

  const renderStep = (defaultevent?: IEvent) => {
    switch (currentStep) {
      case 1:
        return (
          <UpdateEventForm
            defaultStartDate={defaultStartDate}
            isLoading={isRoomLoading}
            rooms={rooms}
            onSubmit={onNext}
            event={defaultevent}
            isReadOnly={isReadOnly && !isLoading}
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
            event={defaultevent}
            isReadOnly={isReadOnly && !isLoading}
          />
        );
      default:
        return <div>Step {currentStep} coming soon...</div>;
    }
  };

  const onEdit = () => {
    incrementStep(1);
    setReadOnly(false);
    setLoading(true);
  };

  const onBack = (data: object) => {
    if (!currentForm) return;
    //if (!isReadOnly) setFormData(data, defaultevent ? defaultevent.eventId : 0);
    setFormData(data, defaultevent ? defaultevent.eventId : 0);
    decrementStep();
  };

  const onNext = async (data: object) => {
    if (!currentForm) return;
    //if (!isReadOnly) setFormData(data, defaultevent ? defaultevent.eventId : 0);
    setFormData(data, defaultevent ? defaultevent.eventId : 0);
    if (isNextVisible) {
      incrementStep();
    } else {
      if (isReadOnly) onClose();

      const stepOne = getStepData(1) as IEventForm;
      const eventObject = {
        eventId: stepOne.eventId,
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

        return;

        const result = await triggerEvent({ ...eventObject, ...ruleObject });
        if (result.status === 201) {
          resetForm();
          onClose();
        }

        //const ruleEndDate = triggerEvent();
      } else {
        return;

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
    if (open === false && (isDirtyRef.current || currentStep > 1) && !isReadOnly) {
      setShowAlert(true);
    } else {
      incrementStep(1);
      if (defaultevent) setReadOnly(true);
      onToggle();
    }
  };

  const onSaveReturn = (data: object) => {
    setFormData(data, defaultevent ? defaultevent.eventId : 0);
    incrementStep(1);
    onClose();
    setShowAlert(false);
  };

  const onDiscardChanges = () => {
    onClose();
    setShowAlert(false);
    if (defaultevent) setReadOnly(true);
    resetForm();
  };

  //const test = useEventDefaultValues(new Date(), loadedEvent ? loadedEvent : defaultevent);

  useEffect(() => {
    if (!loadedEvent || currentStep !== 1 || !isLoading) return;
    currentForm?.reset(getEventDefaultValues(loadedEvent?.startDate, loadedEvent), {
      keepDefaultValues: false,
      keepValues: false,
    });
    setLoading(false);
    //currentForm?.reset();
  }, [currentForm, currentStep, loadedEvent, isLoading]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{children}</SheetTrigger>

        <SheetContent className="w-full md:w-4xl p-4">
          <SheetHeader>
            <SheetTitle>
              {currentStep === 1
                ? isReadOnly
                  ? "View Event"
                  : !isReadOnly && defaultevent
                  ? "Edit Event"
                  : "Create Event"
                : isReadOnly
                ? "View Recurrence"
                : "Edit Reccurrence"}
            </SheetTitle>
            <SheetDescription>
              This form will add an event/appointment to the calendar for the given room and assign it to an individual.
            </SheetDescription>
          </SheetHeader>
          {loadedEvent ? renderStep(loadedEvent) : renderStep(defaultevent)}

          <SheetFooter className="flex sm:flex-col-reverse md:flex-row md:justify-end gap-6 ">
            {isReadOnly && (
              <Button
                form={formId}
                variant={"link"}
                onClick={() => {
                  onEdit();
                }}
              >
                Edit
              </Button>
            )}
            {isBackVisible && (
              <Button
                form={formId}
                variant={"outline"}
                onClick={() => {
                  onBack(currentForm?.getValues());
                }}
              >
                Previous
              </Button>
            )}
            <Button form={formId} type="submit" onClick={currentForm?.handleSubmit(onNext)}>
              {isNextVisible
                ? "Next"
                : isReadOnly
                ? "Close"
                : !isReadOnly && defaultevent
                ? "Save Changes"
                : "Create Event"}
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
            {!defaultevent && (
              <AlertDialogSave onClick={() => onSaveReturn(currentForm?.getValues())} className="sm:mr-auto">
                Save for later
              </AlertDialogSave>
            )}
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

export function useEvent(eventId: number | undefined, shouldRun: boolean) {
  const { data: event } = useSWR<IEvent[]>(shouldRun ? `/api/events/${eventId}` : null);

  if (!event) return undefined;
  const result = z.array(SEvent).safeParse(event);

  if (result.success) return result.data[0];
}
