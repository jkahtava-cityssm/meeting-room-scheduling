import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { CombinedEventSchema, CombinedSchema } from "./event-drawer-schema.validator";

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
import { IEvent } from "@/lib/schemas/calendar";
import { getFormDefaults, mapEventToSchema } from "./lib/default-util";
import { useEventStore } from "@/lib/zustand/new-event-store-refactor";
import { useStepNavigation } from "./use-step-navigation";

export const useMultiStepFormLogic = (props: {
	event?: IEvent;
	creationDate: Date;
	userId?: string;
	roomId?: number;
	formSteps: FormStep[];
	onClose: () => void;
	onOpen: () => void;
	isOpen: boolean;
}) => {
	const { data: config } = usePublicConfiguration();
	const { event: storedEvent, setEvent, resetEvent } = useEventStore();

	const mutationUpsert = useEventsMutationUpsert();
	const mutationCreate = useEventsMutationCreate();
	const mutationDelete = useEventsMutationDelete();

	// 1. Resolve Initial Values
	const defaultFormValues = useMemo(() => {
		if (props.event) return mapEventToSchema(props.event);

		return getFormDefaults(props.creationDate, props.userId, config?.interval, props.roomId);
	}, [props.event, props.creationDate, props.userId, props.roomId, config?.interval]);

	// 2. Form & Navigation State
	const methods = useForm<CombinedSchema>({
		resolver: zodResolver(CombinedEventSchema),
		defaultValues: defaultFormValues,
		mode: "onChange",
	});

	const [status, setStatus] = useState<FormStatus>(defaultFormValues.eventId === "0" ? "New" : "Read");

	const watchIsRecurring = methods.watch("isRecurring");
	const watchStartDate = methods.watch("startDate");
	const watchRuleStartDate = methods.watch("ruleStartDate");

	const isRecurring = watchIsRecurring === "true";
	const startDate = isRecurring && status !== "Edit" ? watchRuleStartDate : watchStartDate;
	const ignoreLastStep = !isRecurring;

	const [dialogConfig, setDialogConfig] = useState<MultiStepFormContextProps["dialogConfig"]>(null);

	// 3. Data Fetching Sync
	const { data: collectedEvent, isFetching } = useEventQuery(Number(defaultFormValues.eventId), props.userId, status === "Loading");

	const validateStep = async (index: number) => {
		const result = await isStepValid(props.formSteps[index], methods);
		return result.status;
	};

	const { currentStepIndex, navigationStatus, nextStep, previousStep, resetNavigation, goToStep } = useStepNavigation(
		props.formSteps.length,
		validateStep,
	);

	// Only reset form if eventId changes (not on every re-render)
	const prevEventIdRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (defaultFormValues.eventId === "0") {
			methods.reset(defaultFormValues);
			setStatus(defaultFormValues.eventId === "0" ? "New" : "Read");
			prevEventIdRef.current = undefined;
		} else if (prevEventIdRef.current !== defaultFormValues.eventId) {
			methods.reset(defaultFormValues);
			setStatus(defaultFormValues.eventId === "0" ? "New" : "Read");
			prevEventIdRef.current = defaultFormValues.eventId;
		}
	}, [defaultFormValues, methods]);

	useEffect(() => {
		if (status === "Loading" && collectedEvent && !isFetching) {
			const parsedData = mapEventToSchema(collectedEvent);
			methods.reset(parsedData);

			setTimeout(() => setStatus("Edit"), 100);
		}
		if (status === "Loading" && !isFetching && !collectedEvent) {
			setStatus("Read");
		}
	}, [status, collectedEvent, isFetching, methods]);

	// 4. Handlers
	const resetForm = useCallback(() => {
		prevEventIdRef.current = undefined;
		methods.reset(defaultFormValues);
		setStatus(defaultFormValues.eventId === "0" ? "New" : "Read");
		resetNavigation();
		props.onClose();
	}, [methods, defaultFormValues, resetNavigation, props]);

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
			roomId: Number(updatedData.roomId),
			userId: updatedData.userId ? Number(updatedData.userId) : null,
			statusId: Number(updatedData.statusId),
			rule: isRecurring ? updatedData.rule : undefined,
		};

		const parsedPayload = SEventPUT.parse(apiPayload);

		if (!parsedPayload.eventId || parsedPayload.eventId === 0) {
			mutationCreate.mutate(parsedPayload, {
				onSuccess: () => {
					resetForm();
				},
			});
		} else {
			mutationUpsert.mutate(SEventPUT.parse(apiPayload), {
				onSuccess: () => {
					resetForm();
				},
			});
		}
	};

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
						resetEvent();
						props.onOpen();
					}
				},
				startNew: () => {
					resetForm();
					props.onOpen();
				},
				none: () => {},
			};

			actions[actionType]?.();
			setDialogConfig(null); // Close dialog
		},
		[dialogConfig, setEvent, methods, props, storedEvent, resetEvent, resetForm],
	);

	return {
		startDate,
		goToStep,
		onDelete,
		methods,
		currentStepIndex,
		status,
		setStatus,
		ignoreLastStep,
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
