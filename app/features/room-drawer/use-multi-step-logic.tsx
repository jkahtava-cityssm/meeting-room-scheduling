import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { CombinedRoomSchema, CombinedSchema } from "./room-drawer-schema.validator";

import { isFormValid, isStepValid } from "./lib/form-helper";
import { ButtonActions, FormStatus, FormStep, MultiStepFormContextProps } from "./types";
import { IRoom } from "@/lib/schemas/calendar";
import { getFormDefaults, mapRoomToSchema } from "./lib/default-util";
import { useStepNavigation } from "../event-drawer-refactor/use-step-navigation";
import { IRoomPUT, SRoomPUT, useRoomQuery, useRoomsMutationDelete, useRoomsMutationUpsert } from "@/lib/services/rooms";

export const useRoomFormLogic = (props: {
  room?: IRoom;
  creationDate?: Date;
  formSteps: FormStep[];
  onClose: () => void;
  onOpen: () => void;
  isOpen: boolean;
}) => {
  const mutationUpsert = useRoomsMutationUpsert();
  const mutationDelete = useRoomsMutationDelete();

  // 1. Resolve Initial Values
  const defaultFormValues = useMemo(() => {
    if (props.room) return mapRoomToSchema(props.room);
    return getFormDefaults();
  }, [props.room]);

  // 2. Form & Navigation State
  const methods = useForm<CombinedSchema>({
    resolver: zodResolver(CombinedRoomSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const [status, setStatus] = useState<FormStatus>(defaultFormValues.roomId === "0" ? "New" : "Read");

  const [dialogConfig, setDialogConfig] = useState<MultiStepFormContextProps["dialogConfig"]>(null);

  // 3. Data Fetching Sync
  const { data: collectedRoom, isFetching } = useRoomQuery(Number(defaultFormValues.roomId), status === "Loading");

  const validateStep = async (index: number) => {
    const result = await isStepValid(props.formSteps[index], methods);
    return result.status;
  };

  const { currentStepIndex, navigationStatus, nextStep, previousStep, resetNavigation, goToStep } = useStepNavigation(
    props.formSteps.length,
    validateStep,
  );

  const prevRoomIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (defaultFormValues.roomId === "0") {
      methods.reset(defaultFormValues);
      setStatus(defaultFormValues.roomId === "0" ? "New" : "Read");
      prevRoomIdRef.current = undefined;
    } else if (prevRoomIdRef.current !== defaultFormValues.roomId) {
      methods.reset(defaultFormValues);
      setStatus(defaultFormValues.roomId === "0" ? "New" : "Read");
      prevRoomIdRef.current = defaultFormValues.roomId;
    }
  }, [defaultFormValues, methods]);

  useEffect(() => {
    if (status === "Loading" && collectedRoom && !isFetching) {
      const parsedData = mapRoomToSchema(collectedRoom);
      methods.reset(parsedData);

      setTimeout(() => setStatus("Edit"), 100);
    }
    if (status === "Loading" && !isFetching && !collectedRoom) {
      setStatus("Read");
    }
  }, [status, collectedRoom, isFetching, methods]);

  // 4. Handlers
  const resetForm = useCallback(() => {
    methods.reset(defaultFormValues);
    setStatus(defaultFormValues.roomId === "0" ? "New" : "Read");
    resetNavigation();
    props.onClose();
  }, [methods, defaultFormValues, resetNavigation, props]);

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

    const apiPayload: z.input<IRoomPUT> = {
      ...formData,
      roomProperty: formData.roomProperty.map((id) => {
        return { propertyId: id, value: "true" };
      }),
      roomRoles: formData.roomRoles.map((id) => {
        return { roleId: id };
      }),
    };

    const b = SRoomPUT.safeParse(apiPayload);

    if (!b.success) {
      console.error(z.prettifyError(b.error));
    }

    if (b.success) {
      mutationUpsert.mutate(b.data, {
        onSuccess: () => {
          resetForm();
        },
      });
    }
  };

  const onDelete = useCallback(() => {
    // If eventId is "0", it only exists in local state/draft
    if (defaultFormValues.roomId === "0") {
      resetForm();
    } else {
      // If it exists on the server, call the mutation
      mutationDelete.mutate(Number(defaultFormValues.roomId), {
        onSuccess: () => {
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
    goToStep,
    onDelete,
    methods,
    currentStepIndex,
    status,
    setStatus,
    resetForm,
    onSave,
    mutationUpsert,
    mutationDelete,
    dialogConfig,
    setDialogConfig,
    handleDialogAction,
    defaultFormValues,
    nextStep,
    previousStep,
    previousStepHasError: navigationStatus.prevError,
    nextStepHasError: navigationStatus.nextError,
  };
};
