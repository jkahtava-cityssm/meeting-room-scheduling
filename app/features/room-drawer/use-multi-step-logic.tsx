import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { CombinedRoomSchema, CombinedSchema } from './drawer-schema.validator';

import { isFormValid, isStepValid } from './lib/form-helper';
import { ButtonActions, FormStatus, FormStep, MultiStepFormContextProps } from './types';
import { IRoom } from '@/lib/schemas';
import { getFormDefaults, mapRoomToSchema } from './lib/default-util';

import { IRoomPUT, SRoomPUT, useRoomQuery, useRoomsMutationCreate, useRoomsMutationDelete, useRoomsMutationUpsert } from '@/lib/services/rooms';
import { useStepNavigation } from './use-step-navigation';

export const useRoomFormLogic = (props: {
  room?: IRoom;
  formSteps: FormStep[];
  onClose: () => void;
  onOpen: () => void;
  isOpen: boolean;
}): MultiStepFormContextProps => {
  const originRef = useRef<HTMLElement | null>(null);

  const mutationCreate = useRoomsMutationCreate();
  const mutationUpsert = useRoomsMutationUpsert();
  const mutationDelete = useRoomsMutationDelete();

  const defaultFormValues = useMemo(() => {
    if (props.room) return mapRoomToSchema(props.room);
    return getFormDefaults();
  }, [props.room]);

  const methods = useForm<CombinedSchema>({
    resolver: zodResolver(CombinedRoomSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (props.isOpen) {
      originRef.current = document.activeElement as HTMLElement;

      methods.reset(defaultFormValues);
      setStatus(defaultFormValues.roomId === '0' ? 'New' : 'Read');
    }
  }, [props.isOpen, methods, defaultFormValues]);

  const { data: collectedRoom, isFetching, refetch } = useRoomQuery(Number(defaultFormValues.roomId), false);

  const [status, setStatus] = useState<FormStatus>(defaultFormValues.roomId === '0' ? 'New' : 'Read');

  const formStatus = useMemo(
    () => ({
      isNew: status === 'New',
      isEditing: status === 'Edit',
      isReadOnly: status === 'Read',
      isLoading: status === 'Loading' || isFetching,
      isSaving: mutationCreate.isPending || mutationUpsert.isPending,
      isDeleting: mutationDelete.isPending,
      isDisabled: status === 'Loading' || mutationCreate.isPending || mutationUpsert.isPending,
    }),
    [status, isFetching, mutationCreate.isPending, mutationUpsert.isPending, mutationDelete.isPending],
  );

  const [dialogConfig, setDialogConfig] = useState<MultiStepFormContextProps['dialogConfig']>(null);

  const validateStep = async (index: number) => {
    const result = await isStepValid(props.formSteps[index], methods);
    return result.status;
  };

  const { currentStepIndex, navigationStatus, nextStep, previousStep, resetNavigation, goToStep } = useStepNavigation(
    props.formSteps.length,
    validateStep,
  );

  useEffect(() => {
    if (formStatus.isLoading && collectedRoom && !isFetching) {
      const parsedData = mapRoomToSchema(collectedRoom);
      methods.reset(parsedData);

      setStatus('Edit');
    }
    if (formStatus.isLoading && !isFetching && !collectedRoom) {
      setStatus('Read');
    }
  }, [collectedRoom, isFetching, methods, formStatus.isLoading]);

  const resetForm = useCallback(() => {
    methods.reset(defaultFormValues);
    setStatus(defaultFormValues.roomId === '0' ? 'New' : 'Read');
    resetNavigation();
    props.onClose();
  }, [methods, defaultFormValues, resetNavigation, props]);

  const onSave = async () => {
    const formData = methods.getValues();

    const formState = await isFormValid(props.formSteps, methods);

    if (!formState.status) {
      setDialogConfig({
        variant: 'info',
        title: 'Submission Incomplete',
        description: 'Errors have been identified, and they must be fixed before submission can occur',
        confirmText: 'Continue Editing',
        errors: formState.errorList,
        showConfirm: true,
        confirmAction: 'none',
      });

      return;
    }

    const apiPayload: z.input<IRoomPUT> = {
      ...formData,
      roomProperty: formData.roomProperty.map((id) => {
        return { propertyId: id, value: 'true' };
      }),
      roomRoles: formData.roomRoles.map((id) => {
        return { roleId: id };
      }),
    };

    const parsedPayload = SRoomPUT.parse(apiPayload);

    if (!parsedPayload.roomId || parsedPayload.roomId === 0) {
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
    if (methods.formState.isDirty && status !== 'Read') {
      setDialogConfig({
        variant: 'warning',
        title: 'Unsaved Changes',
        description: 'You have unsaved changes. Are you sure you want to close?',
        confirmText: 'Dismiss Form',
        cancelText: 'Continue Editing',
        confirmAction: 'dismiss',
        cancelAction: 'none',
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
      methods.reset(mapRoomToSchema(data));
      setStatus('Edit');
      return;
    }

    if (isError || !data) {
      setStatus('Read');
      setDialogConfig({
        variant: 'warning',
        title: 'Edit Failed',
        description: "We couldn't retrieve the latest room details. Please try again later.",
        confirmText: 'Close',
        showConfirm: true,
        confirmAction: 'none',
      });
    }
  }, [methods, refetch]);

  const onDelete = useCallback(() => {
    //If ID === 0, this is a new record, and does not exist in the DB
    if (defaultFormValues.roomId === '0') {
      resetForm();
    } else {
      mutationDelete.mutate(Number(defaultFormValues.roomId), {
        onSettled: () => {
          resetForm();
        },
      });
    }
  }, [defaultFormValues.roomId, mutationDelete, resetForm]);

  const handleDialogAction = useCallback(
    (actionType: ButtonActions) => {
      if (!dialogConfig || !actionType) return;

      const actions: Record<Exclude<ButtonActions, undefined>, () => void> = {
        dismiss: resetForm,
        none: () => {},
      };

      actions[actionType]?.();
      setDialogConfig(null); // Close dialog
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
