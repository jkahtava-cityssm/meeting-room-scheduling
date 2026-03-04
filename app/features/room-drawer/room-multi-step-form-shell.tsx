import { z } from "zod/v4";
import { createContext, useRef, useState } from "react";
import { Form, FormProvider } from "react-hook-form";

import { FormStep, MultiStepFormContextProps } from "./types";

import { useContext } from "react";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";

import React from "react";
import { IEvent, IRoom } from "@/lib/schemas/calendar";

import FormFooter from "./form-footer";
import UnsavedChangesDialog from "./dialog-unsaved-changes";

import { ConfirmErrorDialog } from "./dialog-confirm-prompt";

import { useRoomFormLogic } from "./use-multi-step-logic";
import { useSession } from "@/contexts/SessionProvider";
import { EventDialog } from "./components/dialog";
import { useEventStore } from "@/lib/zustand/new-event-store-refactor";

export const MultiStepFormContext = createContext<MultiStepFormContextProps | null>(null);

export const RoomMultiStepForm = ({
	formSteps,
	creationDate,
	room,
	children,
}: {
	formSteps: FormStep[];
	creationDate?: Date;
	room?: IRoom;
	children: React.ReactNode;
}) => {
	const { session } = useSession();
	const { isOpen, onClose, onOpen } = useDisclosure();
	const [showAlert, setShowAlert] = useState(false);
	const originRef = useRef<HTMLElement | null>(null);

	const logic = useRoomFormLogic({ room, creationDate, formSteps, onClose, isOpen, onOpen });

	const handleOpenChange = (open: boolean) => {
		if (open) {
			originRef.current = document.activeElement as HTMLElement;

			logic.resetForm();
			onOpen();
		} else {
			if (logic.methods.formState.isDirty && logic.status !== "Read") {
				logic.setDialogConfig({
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
					showSave: false,
				});
			} else {
				logic.resetForm();
				onClose();
			}
		}
	};

	const contextValue = {
		...logic,
		steps: formSteps,
		currentStep: formSteps[logic.currentStepIndex],
		isFirstStep: logic.currentStepIndex === 0,
		isLastStep: logic.currentStepIndex === formSteps.length - 1 || logic.ignoreLastStep,
		onClose: () => handleOpenChange(false),
	};

	return (
		<MultiStepFormContext.Provider value={contextValue}>
			<Sheet
				open={isOpen}
				onOpenChange={handleOpenChange}
			>
				<SheetTrigger asChild>{children}</SheetTrigger>

				<SheetContent
					onCloseAutoFocus={e => {
						if (originRef.current) {
							e.preventDefault();
							originRef.current.focus();
						}
					}}
					className="w-full md:w-4xl p-4"
				>
					<SheetHeader>
						<SheetTitle>{contextValue.currentStep.title}</SheetTitle>
						<SheetDescription>
							This form will add an event/appointment to the calendar for the given room and assign it to an individual.
						</SheetDescription>
					</SheetHeader>

					<FormProvider {...logic.methods}>
						<Form>
							<contextValue.currentStep.component
								formStatus={contextValue.status}
								session={session}
							></contextValue.currentStep.component>
						</Form>
					</FormProvider>
					<FormFooter userId={userId}></FormFooter>
				</SheetContent>
			</Sheet>
			{logic.dialogConfig &&
				(() => {
					const dialogConfig = logic.dialogConfig;
					return (
						<>
							<EventDialog
								variant={dialogConfig.variant}
								isOpen={!!dialogConfig}
								onClose={() => logic.setDialogConfig(null)}
								title={dialogConfig.title}
								description={dialogConfig.description}
								errors={dialogConfig.errors}
								onConfirm={() => logic.handleDialogAction(dialogConfig.confirmAction)}
								onCancel={() => logic.handleDialogAction(dialogConfig.cancelAction)}
								onSave={() => logic.handleDialogAction(dialogConfig.saveAction)}
								confirmText={dialogConfig.confirmText ?? "Confirm"}
								cancelText={dialogConfig.cancelText ?? "Cancel"}
								showSave={dialogConfig.showSave}
								showConfirm={dialogConfig.showConfirm}
								showCancel={dialogConfig.showCancel}
							/>
						</>
					);
				})()}

			<UnsavedChangesDialog
				showAlert={false}
				setShowAlert={setShowAlert}
				onClose={onClose}
				{...logic}
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
