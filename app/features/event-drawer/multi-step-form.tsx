import { z } from "zod/v4";
import { createContext, useEffect, useRef, useState } from "react";
import { Form, FormProvider, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { FormStatus, FormStep, MultiStepFormContextProps } from "./types";
import { CombinedEventSchema, CombinedSchema, eventObject, ruleObject, defaultValues, getEventValues } from "./event-drawer.validator";
import { useContext } from "react";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";

import { IEventPUT, SEventPUT, useEventQuery, useEventsMutationDelete, useEventsMutationUpsert } from "@/lib/services/events";
import React from "react";
import { IEvent } from "@/lib/schemas/calendar";
import { useEventStore } from "@/lib/zustand/new-event-store";

import FormFooter from "./multi-step-form-footer";
import UnsavedChangesDialog from "./multi-step-form-unsaved-changes";
import { useSession } from "@/contexts/SessionProvider";
import { isFormValid, isStepValid, updateRRuleIfNecessary } from "./multi-step-form-helper";
import { ConfirmErrorDialog } from "./multi-step-form-confirm-prompt";
import { usePublicConfiguration } from "@/lib/services/public";

export const MultiStepFormContext = createContext<MultiStepFormContextProps | null>(null);

export const MultiStepForm = ({
	formSteps,
	creationDate,
	event,
	userId,
	children,
}: {
	formSteps: FormStep[];
	creationDate?: Date;
	event?: IEvent;
	userId?: string;
	children: React.ReactNode;
}) => {
	const { session } = useSession();
	const { setEvent, resetEvent, getEventState } = useEventStore();
	const { data: configurationData } = usePublicConfiguration();
	const storedEvent = getEventState().event;

	const originElementRef = useRef<HTMLElement | null>(null);

	// Prefer explicit `event` prop, then an explicit `creationDate` (new slot),
	// then any stored draft in session storage. This avoids stale stored drafts
	// overriding a freshly requested creation date.
	const defaultFormValues = event
		? getEventValues(event)
		: creationDate
			? defaultValues(creationDate, userId, configurationData?.interval)
			: storedEvent
				? storedEvent
				: defaultValues(undefined, userId, configurationData?.interval);

	const methods = useForm<CombinedSchema>({
		resolver: zodResolver(CombinedEventSchema),
		defaultValues: defaultFormValues,
		mode: "onChange",
	});

	const { isOpen, onClose, onOpen } = useDisclosure();

	// Form state
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [ignoreLastStep, setIgnoreLastStep] = useState(defaultFormValues["isRecurring"] === "false");
	const [startDate, setStartDate] = useState(
		defaultFormValues.isRecurring === "true" ? defaultFormValues.ruleStartDate : defaultFormValues.startDate,
	);

	const [status, setStatus] = useState<FormStatus>(defaultFormValues["eventId"] === "0" ? "New" : "Read");
	const [showAlert, setShowAlert] = useState(false);
	const [showError, setShowError] = React.useState(false);
	const [errors, setErrors] = React.useState<string[]>([]);

	const currentStep = formSteps[currentStepIndex];
	const [nextButtonDestructive, setNextButtonDestructive] = useState(false);
	const [backButtonDestructive, setBackButtonDestructive] = useState(false);

	const { data: collectedEvent, isPending, isFetching } = useEventQuery(Number(defaultFormValues["eventId"]), userId, status === "Loading");
	const saveButtonEnabled = status === "Edit" || status === "New" || (ignoreLastStep && status !== "Read" && status !== "Loading");
	const editButtonEnabled = status === "Read" || status === "Loading";

	const mutationUpsert = useEventsMutationUpsert();
	const mutationDelete = useEventsMutationDelete();

	useEffect(() => {
		if (status === "Loading" && collectedEvent && !isFetching) {
			const parsedData = getEventValues(collectedEvent);
			methods.reset(parsedData);

			setTimeout(() => {
				setStatus("Edit");
			}, 100);
		}
		//Complains about methods.reset but it is a function and should not be included
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status, collectedEvent, isFetching]);

	// Navigation functions

	// Reset form when incoming props change (creationDate or event).
	// - If the sheet is closed, always reset to the new defaults.
	// - If the sheet is open, only reset when the form is not dirty (avoid clobbering user edits).
	useEffect(() => {
		const newDefaults = event
			? getEventValues(event)
			: creationDate
				? defaultValues(creationDate, userId, configurationData?.interval)
				: storedEvent
					? storedEvent
					: defaultValues(undefined, userId, configurationData?.interval);

		if (!isOpen) {
			// Closed: always reset to new defaults
			methods.reset(newDefaults);
			setStatus(newDefaults["eventId"] === "0" ? "New" : "Read");
			setCurrentStepIndex(0);
			setIgnoreLastStep(newDefaults["isRecurring"] === "false");
			setNextButtonDestructive(false);
			setBackButtonDestructive(false);
			return;
		}

		// Open: only reset when the form is pristine
		if (!methods.formState.isDirty) {
			methods.reset(newDefaults);
			setStatus(newDefaults["eventId"] === "0" ? "New" : "Read");
			setCurrentStepIndex(0);
			setIgnoreLastStep(newDefaults["isRecurring"] === "false");
			setNextButtonDestructive(false);
			setBackButtonDestructive(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [creationDate, event]);
	const nextStep = async () => {
		if (currentStepIndex < formSteps.length - 1 && !ignoreLastStep) {
			// Move to the next step if not at the last step
			setCurrentStepIndex(currentStepIndex + 1);

			const isCurrentStepValid = await isStepValid(formSteps[currentStepIndex], methods);

			if (!isCurrentStepValid.status) {
				setBackButtonDestructive(true);
			} else if (backButtonDestructive === true) {
				setBackButtonDestructive(false);
			}

			if (formSteps.length - 1 === currentStepIndex + 1) {
				setNextButtonDestructive(false);
			}
		}
	};

	const previousStep = async () => {
		if (currentStepIndex > 0) {
			setCurrentStepIndex(currentStepIndex - 1);

			const isCurrentStepValid = await isStepValid(formSteps[currentStepIndex], methods);

			if (!isCurrentStepValid.status) {
				setNextButtonDestructive(true);
			} else if (nextButtonDestructive === true) {
				setNextButtonDestructive(false);
			}

			if (0 === currentStepIndex - 1) {
				setBackButtonDestructive(false);
			}
		}
	};

	const goToStep = (position: number) => {
		if (position >= 0 && position - 1 < formSteps.length) {
			setCurrentStepIndex(position - 1);
		}
	};

	const onDelete = () => {
		if (defaultFormValues["eventId"] === "0") {
			resetForm();
		} else {
			mutationDelete.mutate(Number(defaultFormValues["eventId"]), {
				onSuccess: () => {
					onClose();
				},
			});
		}
	};

	const onSave = async () => {
		const formData = methods.getValues();

		const isRecurring = formData.isRecurring === "true";
		const skipStep = isRecurring ? [] : [1];

		const formState = await isFormValid(formSteps, methods, skipStep);

		if (formData.startDate !== formData.ruleStartDate) {
			formState.errorList.push("Start Date does not match the First Recurrence Date");
		}

		//setErrors(formState.errorList);
		//setShowError(true);
		//return;
		if (!formState.status) {
			return;
		}

		const allData = await updateRRuleIfNecessary(formData);

		if (!allData) return;

		const apiPayload: z.input<IEventPUT> = {
			eventId: formData.eventId ? Number(formData.eventId) : undefined,
			roomId: Number(formData.roomId),
			userId: formData.userId ? Number(formData.userId) : null,
			statusId: Number(formData.statusId),
			title: formData.title,
			description: formData.description || "",
			startDate: formData.startDate,
			endDate: formData.endDate,

			recurrenceId: formData.recurrenceId ? Number(formData.recurrenceId) : null,
			rule: isRecurring ? formData.rule : undefined,
			ruleStartDate: isRecurring ? formData.ruleStartDate : undefined,
			ruleEndDate: isRecurring ? formData.ruleEndDate : undefined,
		};

		const result = SEventPUT.safeParse(apiPayload);

		if (!result.success) {
			console.error("API Data Mismatch:", z.prettifyError(result.error));
			return;
		}

		mutationUpsert.mutate(result.data, {
			onSuccess: () => {
				resetForm();
				onClose();
			},
		});

		//const eventParse = z.safeParse(eventObject, allData);
		//const ruleParse = z.safeParse(ruleObject, allData);

		/*if (eventParse.success && (isRecurring ? ruleParse.success : true)) {
      mutationUpsert.mutate(
        {
          eventData: eventParse.data,
          ruleData: isRecurring && ruleParse.data ? ruleParse.data : null,
        },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
          onError: () => {}, // Optional: handle error
        },
      );
    }*/
	};

	const onOpenChange = (open: boolean) => {
		if (open) {
			onOpenDrawer();
		} else {
			onCloseDrawer();
		}
	};

	const onCloseDrawer = () => {
		if (methods.formState.isDirty && status !== "Read") {
			setShowAlert(true);
			return;
		}
		resetForm();
		onClose();
	};

	const onOpenDrawer = () => {
		originElementRef.current = document.activeElement as HTMLElement;

		resetForm();

		onOpen();
	};

	const resetForm = () => {
		setStatus(defaultFormValues["eventId"] === "0" ? "New" : "Read");
		setCurrentStepIndex(0);
		setIgnoreLastStep(defaultFormValues["isRecurring"] === "false" ? true : false);
		setNextButtonDestructive(false);
		setBackButtonDestructive(false);
		methods.reset(defaultFormValues);
	};

	// Context value
	const value: MultiStepFormContextProps = {
		currentStep: formSteps[currentStepIndex],
		currentStepIndex,
		isFirstStep: currentStepIndex === 0,
		isLastStep: currentStepIndex === formSteps.length - 1 || ignoreLastStep,
		ignoreLastStep,
		userId,
		setIgnoreLastStep,
		goToStep,
		nextStep,
		previousStep,
		steps: formSteps,
		startDate: startDate,
		setStartDate,
	};

	return (
		<MultiStepFormContext.Provider value={value}>
			<Sheet
				open={isOpen}
				onOpenChange={onOpenChange}
			>
				<SheetTrigger asChild>{children}</SheetTrigger>

				<SheetContent
					onCloseAutoFocus={e => {
						if (originElementRef.current) {
							e.preventDefault(); // Stop Radix from trying to focus the hidden proxy trigger
							originElementRef.current.focus();
						}
					}}
					className="w-full md:w-4xl p-4"
				>
					<SheetHeader>
						<SheetTitle>{currentStep.title}</SheetTitle>
						<SheetDescription>
							This form will add an event/appointment to the calendar for the given room and assign it to an individual.
						</SheetDescription>
					</SheetHeader>

					<FormProvider {...methods}>
						<Form>
							<currentStep.component
								formStatus={status}
								session={session}
							></currentStep.component>
						</Form>
					</FormProvider>
					<FormFooter
						saveButtonEnabled={saveButtonEnabled}
						editButtonEnabled={editButtonEnabled}
						status={status}
						session={session}
						userId={userId}
						isSaving={mutationUpsert.isPending}
						onSave={onSave}
						onOpenChange={onOpenChange}
						currentStepIndex={currentStepIndex}
						formSteps={formSteps}
						ignoreLastStep={ignoreLastStep}
						previousStep={previousStep}
						nextStep={nextStep}
						backButtonDestructive={backButtonDestructive}
						nextButtonDestructive={nextButtonDestructive}
						onDelete={onDelete}
						isDeleting={mutationDelete.isPending}
						setStatus={setStatus}
					></FormFooter>
				</SheetContent>
			</Sheet>
			<ConfirmErrorDialog
				showError={showError}
				errors={errors}
				onClose={() => {}}
				setShowError={setShowError}
			></ConfirmErrorDialog>
			<UnsavedChangesDialog
				showAlert={showAlert}
				defaultFormValues={defaultFormValues}
				setEvent={() => setEvent(methods.getValues())}
				resetEvent={resetEvent}
				resetForm={resetForm}
				onClose={onClose}
				setShowAlert={setShowAlert}
			></UnsavedChangesDialog>
		</MultiStepFormContext.Provider>
	);
};

export const useMultiStepForm = () => {
	const context = useContext(MultiStepFormContext);
	if (!context) {
		throw new Error("useMultiStepForm must be used within MultiStepForm.Provider");
	}
	return context;
};
