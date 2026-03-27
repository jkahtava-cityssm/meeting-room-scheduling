import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { CombinedSchema, CombinedUserSchema } from "./drawer-schema.validator";

import { isFormValid, isStepValid } from "./lib/form-helper";
import { ButtonActions, FormStatus, FormStep, MultiStepFormContextProps } from "./types";
import { IUser } from "@/lib/schemas";
import { getFormDefaults, mapUserToSchema } from "./lib/default-util";

import { useStepNavigation } from "./use-step-navigation";
import {
  SUserPUT,
  useUserQuery,
  useUsersMutationCreate,
  useUsersMutationDelete,
  useUsersMutationUpsert,
} from "@/lib/services/users";

export const useMultiStepFormLogic = (props: {
  user?: IUser;
  formSteps: FormStep[];
  onClose: () => void;
  onOpen: () => void;
  isOpen: boolean;
}): MultiStepFormContextProps => {
  const originRef = useRef<HTMLElement | null>(null);

  const mutationUpsert = useUsersMutationUpsert();
  const mutationCreate = useUsersMutationCreate();
  const mutationDelete = useUsersMutationDelete();

  // 1. Resolve Initial Values
  const defaultFormValues = useMemo(() => {
    if (props.user) return mapUserToSchema(props.user);

    return getFormDefaults();
  }, [props.user]);

  // 2. Form & Navigation State
  const methods = useForm<CombinedSchema>({
    resolver: zodResolver(CombinedUserSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (props.isOpen) {
      originRef.current = document.activeElement as HTMLElement;

      methods.reset(defaultFormValues);
      setStatus(defaultFormValues.userId === "0" ? "New" : "Read");
    }
  }, [props.isOpen, methods, defaultFormValues]);

  const { data: collectedEvent, isFetching, refetch } = useUserQuery(Number(defaultFormValues.userId), false);

  const [status, setStatus] = useState<FormStatus>(defaultFormValues.userId === "0" ? "New" : "Read");

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

  const [dialogConfig, setDialogConfig] = useState<MultiStepFormContextProps["dialogConfig"]>(null);

  const validateStep = async (index: number) => {
    const result = await isStepValid(props.formSteps[index], methods);
    return result.status;
  };

  const { currentStepIndex, navigationStatus, nextStep, previousStep, resetNavigation, goToStep } = useStepNavigation(
    props.formSteps.length,
    validateStep,
  );

  useEffect(() => {
    if (formStatus.isLoading && collectedEvent && !isFetching) {
      const parsedData = mapUserToSchema(collectedEvent);
      methods.reset(parsedData);

      setStatus("Edit");
    }
    if (formStatus.isLoading && !isFetching && !collectedEvent) {
      setStatus("Read");
    }
  }, [collectedEvent, isFetching, methods, formStatus.isLoading]);

  const resetForm = useCallback(() => {
    methods.reset(defaultFormValues);
    setStatus(defaultFormValues.userId === "0" ? "New" : "Read");
    resetNavigation();
    props.onClose();
  }, [defaultFormValues, methods, props, resetNavigation]);

  const onSave = async () => {
    const formData = methods.getValues();
    const formState = await isFormValid(props.formSteps, methods);

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

    const parsedPayload = SUserPUT.parse(formData);

    if (!parsedPayload.userId || parsedPayload.userId === 0) {
      mutationCreate.mutate(parsedPayload, {
        onSettled: () => {
          resetForm();
        },
      });
    } else {
      mutationUpsert.mutate(parsedPayload, {
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
        cancelAction: "none",
        showConfirm: true,
        showCancel: true,
      });
    } else {
      resetForm();
    }
  }, [methods, status, resetForm]);

  const onEdit = useCallback(async () => {
    const { data, isError, error } = await refetch();

    if (data && !isError) {
      methods.reset(mapUserToSchema(data));
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
    if (defaultFormValues.userId === "0") {
      resetForm();
    } else {
      // If it exists on the server, call the mutation
      mutationDelete.mutate(Number(defaultFormValues.userId), {
        onSuccess: () => {
          resetForm();
        },
      });
    }
  }, [defaultFormValues.userId, mutationDelete, resetForm]);

  const handleDialogAction = useCallback(
    (actionType: ButtonActions) => {
      if (!dialogConfig || !actionType) return;

      const actions: Record<Exclude<ButtonActions, undefined>, () => void> = {
        dismiss: resetForm,
        none: () => {},
      };

      actions[actionType]?.();
      setDialogConfig(null);
    },
    [dialogConfig, resetForm],
  );

  return {
    ...formStatus,
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
    isLastStep: currentStepIndex === props.formSteps.length - 1,
    originRef,
  };
};
