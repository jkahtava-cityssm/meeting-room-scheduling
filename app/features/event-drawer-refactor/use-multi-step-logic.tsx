import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { CombinedEventSchema, CombinedSchema } from "./event-drawer-schema.validator";

import { usePublicConfiguration } from "@/lib/services/public";
import { useEventQuery, useEventsMutationUpsert, useEventsMutationDelete, SEventPUT, IEventPUT } from "@/lib/services/events";
import { isFormValid, isStepValid, updateRRuleIfNecessary } from "./lib/form-helper";
import { ButtonActions, FormStatus, FormStep, MultiStepFormContextProps } from "./types";
import { IEvent } from "@/lib/schemas/calendar";
import { getFormDefaults, mapEventToSchema } from "./lib/default-util";
import { useEventStore } from "@/lib/zustand/new-event-store-refactor";

export const useMultiStepFormLogic = (props: {
	event?: IEvent;
	creationDate?: Date;
	userId?: string;
	formSteps: FormStep[];
	onClose: () => void;
	onOpen: () => void;
	isOpen: boolean;
}) => {
	const { data: config } = usePublicConfiguration();
	const storedEvent = useEventStore(state => state.event);
	const { setEvent } = useEventStore();
	const mutationUpsert = useEventsMutationUpsert();
	const mutationDelete = useEventsMutationDelete();

	// 1. Resolve Initial Values
	const defaultFormValues = useMemo(() => {
		if (props.event) return mapEventToSchema(props.event);
		if (props.creationDate) return getFormDefaults(props.creationDate, props.userId, config?.interval);

		return getFormDefaults(undefined, props.userId, config?.interval);
	}, [props.event, props.creationDate, props.userId, config]);

	// 2. Form & Navigation State
	const methods = useForm<CombinedSchema>({
		resolver: zodResolver(CombinedEventSchema),
		defaultValues: defaultFormValues,
		mode: "onChange",
	});

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [status, setStatus] = useState<FormStatus>(defaultFormValues.eventId === "0" ? "New" : "Read");
	const [ignoreLastStep, setIgnoreLastStep] = useState(defaultFormValues.isRecurring === "false");
	const [startDate, setStartDate] = useState(
		defaultFormValues.isRecurring === "true" ? defaultFormValues.ruleStartDate : defaultFormValues.startDate,
	);

	const [navigationStatus, setNavigationStatus] = useState({
		prevError: false,
		nextError: false,
	});

	const [dialogConfig, setDialogConfig] = useState<MultiStepFormContextProps["dialogConfig"]>(null);

	// 3. Data Fetching Sync
	const { data: collectedEvent, isFetching } = useEventQuery(Number(defaultFormValues.eventId), status === "Loading");

	useEffect(() => {
		if (status === "Loading" && collectedEvent && !isFetching) {
			const parsedData = mapEventToSchema(collectedEvent);
			methods.reset(parsedData);
			setStartDate(parsedData.isRecurring === "true" ? parsedData.ruleStartDate : parsedData.startDate);
			setTimeout(() => setStatus("Edit"), 100);
		}
	}, [status, collectedEvent, isFetching, methods]);

	// 4. Handlers
	const resetForm = useCallback(() => {
		methods.reset(defaultFormValues);
		setCurrentStepIndex(0);
		setStatus(defaultFormValues.eventId === "0" ? "New" : "Read");
		setIgnoreLastStep(defaultFormValues.isRecurring === "false");
		setStartDate(defaultFormValues.isRecurring === "true" ? defaultFormValues.ruleStartDate : defaultFormValues.startDate);
		setNavigationStatus({ prevError: false, nextError: false });
	}, [methods, defaultFormValues]);

	const onSave = async () => {
		const formData = methods.getValues();
		const isRecurring = formData.isRecurring === "true";
		const formState = await isFormValid(props.formSteps, methods, isRecurring ? [] : [1]);

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

		const allData = await updateRRuleIfNecessary(formData);
		if (!allData) return;

		let finalStartDate = formData.startDate;
		if (isRecurring && formData.ruleStartDate && formData.startDate !== formData.ruleStartDate) {
			finalStartDate = formData.ruleStartDate;
		}

		const apiPayload: z.input<IEventPUT> = {
			...formData,
			startDate: finalStartDate,
			eventId: formData.eventId ? Number(formData.eventId) : undefined,
			roomId: Number(formData.roomId),
			userId: formData.userId ? Number(formData.userId) : null,
			statusId: Number(formData.statusId),
			rule: isRecurring ? formData.rule : undefined,
		};

		mutationUpsert.mutate(SEventPUT.parse(apiPayload), {
			onSuccess: () => {
				resetForm();
				props.onClose();
			},
		});
	};

	const goToStep = useCallback(
		(position: number) => {
			// Basic bounds checking
			if (position >= 0 && position < props.formSteps.length) {
				setCurrentStepIndex(position);
			}
		},
		[props.formSteps.length],
	);

	const onDelete = useCallback(() => {
		// If eventId is "0", it only exists in local state/draft
		if (defaultFormValues.eventId === "0") {
			resetForm();
			props.onClose();
		} else {
			// If it exists on the server, call the mutation
			mutationDelete.mutate(Number(defaultFormValues.eventId), {
				onSuccess: () => {
					resetForm();
					props.onClose();
				},
			});
		}
	}, [defaultFormValues.eventId, mutationDelete, resetForm, props]);

	const handleStepChange = useCallback(
		async (direction: "next" | "back") => {
			const isMovingNext = direction === "next";
			const canMove = isMovingNext ? currentStepIndex < props.formSteps.length - 1 && !ignoreLastStep : currentStepIndex > 0;

			if (!canMove) return;

			// 1. Validate the step we are currently on BEFORE moving
			const validation = await isStepValid(props.formSteps[currentStepIndex], methods);
			const isCurrentInvalid = !validation.status;

			// 2. Set destructive states based on direction
			if (isMovingNext) {
				setNavigationStatus(prev => ({
					prevError: isCurrentInvalid,
					nextError: currentStepIndex + 1 === props.formSteps.length - 1 ? false : prev.nextError,
				}));

				setCurrentStepIndex(prev => prev + 1);
			} else {
				setNavigationStatus(prev => ({
					prevError: currentStepIndex - 1 === 0 ? false : prev.prevError,
					nextError: isCurrentInvalid,
				}));

				setCurrentStepIndex(prev => prev - 1);
			}
		},
		[currentStepIndex, props.formSteps, ignoreLastStep, methods],
	);

	const handleDialogAction = useCallback(
		(actionType: ButtonActions) => {
			if (!dialogConfig) return;

			if (actionType === "dismiss") {
				// Logic for deleting/dismissing
				if (defaultFormValues.eventId === "0") {
					resetForm();
					props.onClose();
				} else {
					mutationDelete.mutate(Number(defaultFormValues.eventId), {
						onSuccess: () => {
							resetForm();
							props.onClose();
						},
					});
				}
			}

			if (actionType === "save") {
				setEvent(methods.getValues());
				props.onClose();
			}

			if (actionType === "restore") {
				if (storedEvent) {
					methods.reset(storedEvent);
					setStartDate(storedEvent.isRecurring === "true" ? storedEvent.ruleStartDate : storedEvent.startDate);
					props.onOpen();
				}
			}

			if (actionType === "startNew") {
				resetForm();
				props.onOpen();
			}
			setDialogConfig(null); // Close dialog
		},
		[dialogConfig, defaultFormValues.eventId, resetForm, props, mutationDelete, setEvent, methods, storedEvent],
	);

	return {
		startDate,
		setStartDate,
		goToStep,
		onDelete,
		methods,
		currentStepIndex,
		status,
		setStatus,
		ignoreLastStep,
		setIgnoreLastStep,
		resetForm,
		onSave,
		mutationUpsert,
		mutationDelete,
		dialogConfig,
		setDialogConfig,
		handleDialogAction,
		defaultFormValues,
		nextStep: () => handleStepChange("next"),
		previousStep: () => handleStepChange("back"),
		previousStepHasError: navigationStatus.prevError,
		nextStepHasError: navigationStatus.nextError,
	};
};
