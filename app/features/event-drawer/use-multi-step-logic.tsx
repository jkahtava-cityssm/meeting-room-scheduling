import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { CombinedSchema, getCombinedSchema } from "./drawer-schema.validator";

import { usePublicConfiguration } from "@/lib/services/public";
import {
  useEventQuery,
  useEventsMutationUpsert,
  useEventsMutationDelete,
  SEventPUT,
  IEventPUT,
  useEventsMutationCreate,
} from "@/lib/services/events";
import { isFormValid, isStepValid, reconcileRecurringEventDates } from "./lib/form-helper";
import { ButtonActions, FormStatus, FormStep, MultiStepFormContextProps } from "./types";
import { IEventSingleRoom } from "@/lib/schemas";
import { getFormDefaults, mapEventToSchema } from "./lib/default-util";
import { useEventStore } from "@/lib/zustand/new-event-store-refactor";
import { useStepNavigation } from "./use-step-navigation";
import { useConfigurationQuery, usePrivateConfigurationQuery } from "@/lib/services/configuration";
import { TimeInterval } from "@/components/calendar-time-picker/useTimePicker";

export const useMultiStepFormLogic = (props: {
  event?: IEventSingleRoom;
  draft?: CombinedSchema;
  creationDate: Date;
  userId?: string;
  roomId?: number;
  formSteps: FormStep[];
  onClose: () => void;
  onOpen: () => void;
  isOpen: boolean;
  interval: TimeInterval;
  minHour: number;
  maxHour: number;
  maxSpan: number;
  restrictHours: boolean;
}): MultiStepFormContextProps => {
  const originRef = useRef<HTMLElement | null>(null);
  const { event: storedEvent, setEvent, resetEvent } = useEventStore();

  const mutationUpsert = useEventsMutationUpsert();
  const mutationCreate = useEventsMutationCreate();
  const mutationDelete = useEventsMutationDelete();

  // 1. Resolve Initial Values
  const defaultFormValues = useMemo(() => {
    if (props.event) return mapEventToSchema(props.event);

    return getFormDefaults(props.creationDate, props.userId, props.interval, props.roomId);
  }, [props.event, props.creationDate, props.userId, props.interval, props.roomId]);

  const dynamicSchema = useMemo(
    () => getCombinedSchema(props.minHour, props.maxHour, props.restrictHours),
    [props.minHour, props.maxHour, props.restrictHours],
  );

  // 2. Form & Navigation State
  const methods = useForm<CombinedSchema>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (props.isOpen) {
      originRef.current = document.activeElement as HTMLElement;

      methods.reset(defaultFormValues);
      setStatus(defaultFormValues.eventId === "0" ? "New" : "Read");
      /*if (hasStoredDraft && isNewEvent) {
				setDialogConfig({
					variant: "info",
					title: "Draft Found",
					description: "You have an unfinished booking. Would you like to restore it?",
					confirmText: "Restore Draft",
					cancelText: "Start New",
					confirmAction: "restore",
					cancelAction: "startNew",
					showCancel: true,
					showConfirm: true,
				});
			} else {

			}*/
    }
  }, [props.isOpen, methods, defaultFormValues]);

  const {
    data: collectedEvent,
    isFetching,
    refetch,
  } = useEventQuery(Number(defaultFormValues.eventId), props.userId, false);

  const [status, setStatus] = useState<FormStatus>(defaultFormValues.eventId === "0" ? "New" : "Read");

  const formStatus = useMemo(
    () => ({
      isNew: status === "New",
      isEditing: status === "Edit",
      isReadOnly: status === "Read",
      isLoading: status === "Loading" || isFetching,
      isSaving: mutationCreate.isPending || mutationUpsert.isPending,
      isDeleting: mutationDelete.isPending,
      isDisabled: status === "Loading" || mutationCreate.isPending || mutationUpsert.isPending,
    }),
    [status, isFetching, mutationCreate.isPending, mutationUpsert.isPending, mutationDelete.isPending],
  );

  const watchIsRecurring = methods.watch("isRecurring");
  const watchStartDate = methods.watch("startDate");
  const watchRuleStartDate = methods.watch("ruleStartDate");

  const isRecurring = watchIsRecurring === "true";
  const startDate = isRecurring && status !== "Edit" ? watchRuleStartDate : watchStartDate;
  const ignoreLastStep = !isRecurring;

  const [dialogConfig, setDialogConfig] = useState<MultiStepFormContextProps["dialogConfig"]>(null);

  const validateStep = async (index: number) => {
    const result = await isStepValid(props.formSteps[index], methods);
    return result.status;
  };

  const { currentStepIndex, navigationStatus, nextStep, previousStep, resetNavigation, goToStep } = useStepNavigation(
    props.formSteps.length,
    validateStep,
  );

  const resetForm = useCallback(() => {
    methods.reset(defaultFormValues);
    setStatus(defaultFormValues.eventId === "0" ? "New" : "Read");
    resetNavigation();
    props.onClose();
  }, [defaultFormValues, methods, props, resetNavigation]);

  const onSave = async () => {
    const formData = methods.getValues();
    const isRecurring = formData.isRecurring === "true";
    const validationStepsToSkip = isRecurring ? [] : [1];
    const formState = await isFormValid(props.formSteps, methods, validationStepsToSkip);

    if (!formState.status) {
      setDialogConfig({
        variant: "info",
        title: "Submission Incomplete",
        description: "Errors have been identified, and they must be fixed before submission can occur",
        confirmText: "Continue Editing",
        errors: formState.errorList,
        showConfirm: true,
        confirmAction: "none",
      });

      return;
    }

    const updatedData = await reconcileRecurringEventDates(formData);
    if (!updatedData) return;

    const apiPayload: z.input<IEventPUT> = {
      ...updatedData,
      eventId: updatedData.eventId ? Number(updatedData.eventId) : undefined,
      eventRooms: updatedData.eventRoomIds,
      userId: updatedData.userId ? Number(updatedData.userId) : null,
      statusId: Number(updatedData.statusId),
      rule: isRecurring ? updatedData.rule : undefined,
      eventRecipients: updatedData.eventRecipientIds,
      eventItems: updatedData.eventItemIds,
    };

    const parsedPayload = SEventPUT.parse(apiPayload);

    if (!parsedPayload.eventId || parsedPayload.eventId === 0) {
      mutationCreate.mutate(parsedPayload, {
        onSettled: () => {
          resetForm();
        },
      });
    } else {
      mutationUpsert.mutate(SEventPUT.parse(apiPayload), {
        onSettled: () => {
          resetForm();
        },
      });
    }
  };

  const handleOpenChange = useCallback(() => {
    if (methods.formState.isDirty && status !== "Read") {
      setDialogConfig({
        variant: "warning",
        title: "Unsaved Changes",
        description: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Dismiss Form",
        cancelText: "Continue Editing",
        confirmAction: "dismiss",
        saveAction: "save",
        cancelAction: "none",
        showConfirm: true,
        showCancel: true,
        showSave: false, //!props.event,
      });
    } else {
      resetForm();
    }
  }, [methods, status, resetForm]);

  const onEdit = useCallback(async () => {
    const { data, isError, error } = await refetch();

    if (data && !isError) {
      methods.reset(mapEventToSchema(data));
      setStatus("Edit");
      return;
    }

    if (isError || !data) {
      setStatus("Read");
      setDialogConfig({
        variant: "warning",
        title: "Edit Failed",
        description: "We couldn't retrieve the latest event details. Please try again later.",
        confirmText: "Close",
        showConfirm: true,
        confirmAction: "none",
      });
    }
  }, [methods, refetch]);

  const onDelete = useCallback(() => {
    // If eventId is "0", it only exists in local state/draft
    if (defaultFormValues.eventId === "0") {
      resetForm();
    } else {
      // If it exists on the server, call the mutation
      mutationDelete.mutate(Number(defaultFormValues.eventId), {
        onSuccess: () => {
          resetForm();
        },
      });
    }
  }, [defaultFormValues.eventId, mutationDelete, resetForm]);

  const handleDialogAction = useCallback(
    (actionType: ButtonActions) => {
      if (!dialogConfig || !actionType) return;

      const actions: Record<Exclude<ButtonActions, undefined>, () => void> = {
        dismiss: resetForm,
        save: () => {
          setEvent(methods.getValues());
          resetForm();
        },
        restore: () => {
          if (storedEvent) {
            methods.reset(storedEvent, { keepDefaultValues: true });

            //resetEvent();
          }
        },
        startNew: () => {
          resetForm();
        },
        none: () => {},
      };

      actions[actionType]?.();
      setDialogConfig(null);
    },
    [dialogConfig, setEvent, methods, storedEvent, resetForm],
  );

  return {
    ...formStatus,

    startDate,
    goToStep,
    methods,
    currentStepIndex,
    status,
    setStatus,
    resetForm,
    onSave,
    onEdit,
    onClose: props.onClose,
    onDelete,
    mutationUpsert,
    mutationDelete,
    dialogConfig,
    setDialogConfig,
    handleDialogAction,
    handleOpenChange,
    defaultFormValues,
    nextStep,
    previousStep,
    previousStepHasError: navigationStatus.prevError,
    nextStepHasError: navigationStatus.nextError,
    steps: props.formSteps,
    currentStep: props.formSteps[currentStepIndex],
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === props.formSteps.length - 1 || ignoreLastStep,
    minHour: props.minHour,
    maxHour: props.maxHour,
    maxSpan: props.maxSpan,
    interval: props.interval,
    originRef,
  };
};
