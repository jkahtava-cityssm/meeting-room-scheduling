"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { getEventDefaultValues, IEventForm, UpdateEventForm } from "./dialog-event-form-step-1";
import { IRecurrenceForm, UpdateRecurrenceForm } from "./dialog-event-form-step-2";

import { SEvent } from "@/lib/schemas/calendar";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
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
} from "../ui/alert-dialog";
import { useEventForm } from "@/contexts/EventFormProvider";

import { addYears, endOfDay, startOfDay } from "date-fns";
import z from "zod/v4";
import { IEvent } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import { useEventQuery, useEventsMutationDelete, useEventsMutationUpsert } from "@/services/events";

import { Trash } from "lucide-react";
import { useRoomsQuery } from "@/services/rooms";

const SubmitSchemaEvent = z.object({
  eventId: z.number(),
  roomId: z.number(),
  description: z.string(),
  title: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  recurrenceId: z.number(),
});

const SubmitSchemaRecurrence = z.object({
  rule: z.string(),
  ruleStartDate: z.date(),
  ruleEndDate: z.date(),
});

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
  const isEditable = defaultevent ? true : false && defaultevent?.eventId !== undefined;

  const { isOpen, onClose, onToggle } = useDisclosure();
  const [showAlert, setShowAlert] = useState(false);
  const [isReadOnly, setReadOnly] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const [fetchEnabled, setFetchEnabled] = useState(false);

  const [event, setEvent] = useState<IEvent>();
  //console.log(event);
  //console.log(defaultevent);
  const { isPending: isRoomLoading, data: rooms } = useRoomsQuery();
  //const currentStep = useFormStore((state) => state.currentStep);
  //const startDate: Date = startOfDay(defaultStartDate ? defaultStartDate : new Date());
  //const endDate: Date = endOfDay(defaultStartDate ? defaultStartDate : new Date());

  /*const { trigger: triggerEvent } = useSWRMutation(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`,
    sendPOSTRequest
  );*/

  //const loadedEvent = useEvent(defaultevent?.eventId, !isReadOnly && defaultevent ? true : false);

  const { isPending, error, data: loadedEvent, isFetching } = useEventQuery(defaultevent?.eventId, fetchEnabled);

  const mutationUpsert = useEventsMutationUpsert();
  const mutationDelete = useEventsMutationDelete();

  //console.log(isFetching);
  //console.log(isPending);
  //console.log("isEditable", isEditable);
  //console.log("loadedEvent", loadedEvent);
  //console.log("isReadOnly", isReadOnly);
  //const params = useParams();
  //console.log(params);
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

  //console.log(currentStep);

  const onEditForm = () => {
    incrementStep(0);
    setFetchEnabled(true);
    //setReadOnly(false);
    setLoading(true);
  };

  const onBackPage = (data: object) => {
    if (!currentForm) return;

    setFormData(data);
    decrementStep();
  };

  const onNextPage = async (data: object) => {
    if (!currentForm) return;

    setFormData(data);
    incrementStep();
  };

  const onSaveForm = async (data: object) => {
    if (!currentForm) return;
    //if (!isReadOnly) setFormData(data, defaultevent ? defaultevent.eventId : 0);
    setFormData(data);

    const stepOne = getStepData(0) as IEventForm;
    const eventObject = {
      eventId: stepOne.eventId,
      roomId: stepOne.roomId,
      startDate: stepOne.startDate,
      endDate: stepOne.endDate,
      title: stepOne.title,
      description: stepOne.description,
      recurrenceId: stepOne.recurrenceId,
    };

    if (!isValidSchema(SubmitSchemaEvent, eventObject)) return;

    if (currentStep == 1) {
      const stepTwo = getStepData(1) as IRecurrenceForm;

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

      mutationUpsert.mutate(
        { eventData: eventObject, ruleData: ruleObject },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );

      /*const result = { status: null }; //await triggerEvent({ ...eventObject, ...ruleObject }, { revalidate: false });
      if (result.status === 201 || result.status === 200) {
        resetForm();
        onClose();
      }*/

      //const ruleEndDate = triggerEvent();
    } else {
      mutationUpsert.mutate(
        { eventData: eventObject, ruleData: null },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );

      /*const result = { status: null }; //await triggerEvent({ ...eventObject }, { revalidate: false });
      if (result.status === 201 || result.status === 200) {
        resetForm();
        onClose();
      }*/

      //triggerEvent({ ...eventObject });
    }
  };

  //const onCloseForm = async (data: object) => {};

  const onOpenChange = (open: boolean) => {
    if (open === false && (isDirtyRef.current || currentStep > 0) && !isReadOnly) {
      setShowAlert(true);
    } else {
      incrementStep(0);
      if (defaultevent) setReadOnly(true);
      onToggle();
    }
  };

  const onSaveReturn = (data: object) => {
    setFormData(data, defaultevent ? defaultevent.eventId : 0);
    incrementStep(0);
    onClose();
    setShowAlert(false);
  };

  const onDiscardChanges = () => {
    onClose();
    setShowAlert(false);
    if (defaultevent) setReadOnly(true);
    resetForm();
  };

  const onDeleteEvent = (eventId: number) => {
    mutationDelete.mutate(eventId, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
  };

  //const test = useEventDefaultValues(new Date(), loadedEvent ? loadedEvent : defaultevent);

  useEffect(() => {
    if (!fetchEnabled || !loadedEvent || currentStep !== 0) return;

    setEvent(loadedEvent);

    const test = getEventDefaultValues(loadedEvent?.startDate, loadedEvent);
    /*setFormData(test);
    currentForm?.reset(test, {
      keepDefaultValues: false,
      keepValues: false,
    });*/
    setReadOnly(false);
    setLoading(false);

    setFetchEnabled(false);
    //currentForm?.reset();
  }, [currentForm, currentStep, loadedEvent, isLoading, setFormData, fetchEnabled]);

  const renderStep = (event: IEvent, action: "new" | "edit" | "read") => {
    switch (currentStep) {
      case 0:
        return action === "read" ? (
          <UpdateEventForm
            key={`${event?.eventId}-read`}
            defaultStartDate={defaultStartDate}
            isLoading={isRoomLoading}
            rooms={rooms}
            onSubmit={onNextPage}
            event={event}
            isReadOnly={true}
          ></UpdateEventForm>
        ) : action === "new" ? (
          <UpdateEventForm
            key={`${event.eventId}-edit`}
            defaultStartDate={defaultStartDate}
            isLoading={isRoomLoading}
            rooms={rooms}
            onSubmit={onNextPage}
            event={event}
            isReadOnly={false}
          ></UpdateEventForm>
        ) : (
          <UpdateEventForm
            defaultStartDate={defaultStartDate}
            isLoading={isRoomLoading}
            rooms={rooms}
            onSubmit={onNextPage}
            event={defaultevent}
            isReadOnly={false}
          ></UpdateEventForm>
        );

      case 1:
        const startDate = getKeyData(0, "startDate");
        //setKeyData("startDate", "2000-01-01", 2);
        //return <ReadEventForm event={defaultevent} rooms={rooms}></ReadEventForm>;
        return (
          <UpdateRecurrenceForm
            isLoading={false}
            onSubmit={onNextPage}
            defaultStartDate={startDate ? new Date(startDate) : new Date()}
            event={defaultevent}
            isReadOnly={isReadOnly}
          />
        );
      default:
        return <div>Step {currentStep} coming soon...</div>;
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{children}</SheetTrigger>

        <SheetContent className="w-full md:w-4xl p-4">
          <SheetHeader>
            <SheetTitle>
              {currentStep === 0
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

          {event ? renderStep(event, "edit") : renderStep(defaultevent, "read")}

          <SheetFooter className="flex sm:flex-col-reverse md:flex-row md:justify-end gap-6 ">
            {!isReadOnly && defaultevent && (
              <Button
                variant={"destructive"}
                className="mr-auto"
                onClick={() => {
                  onDeleteEvent(loadedEvent && !isReadOnly ? loadedEvent.eventId : defaultevent?.eventId);
                }}
              >
                <Trash></Trash>
                Delete
              </Button>
            )}
            {isReadOnly && (
              <Button
                form={formId}
                variant={"link"}
                onClick={() => {
                  onEditForm();
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
                  onBackPage(currentForm?.getValues());
                }}
              >
                Previous
              </Button>
            )}

            {isNextVisible ? (
              <Button form={formId} type="submit" onClick={currentForm?.handleSubmit(onNextPage)}>
                Next
              </Button>
            ) : isReadOnly ? (
              <Button form={formId} type="submit" onClick={currentForm?.handleSubmit(onClose)}>
                Close
              </Button>
            ) : !isReadOnly && defaultevent ? (
              <Button form={formId} type="submit" onClick={currentForm?.handleSubmit(onSaveForm)}>
                Save Changes
              </Button>
            ) : (
              <Button form={formId} type="submit" onClick={currentForm?.handleSubmit(onSaveForm)}>
                Create Event
              </Button>
            )}
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
  /*const { data: event } = useSWR<IEvent[]>(shouldRun ? `/api/events/${eventId}` : null, {
    revalidateOnMount: true,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 1,
  });*/

  const {
    isPending,
    error,
    data: event,
    isFetching,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}`);
      return await response.json();
    },
    enabled: shouldRun && eventId !== undefined,
  });

  if (!event) return undefined;
  const result = z.array(SEvent).safeParse(event);

  if (result.success) return result.data[0];
}
