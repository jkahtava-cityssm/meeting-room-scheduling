import { z } from "zod/v4";
import { createContext, useRef, useState } from "react";
import { Form, FormProvider } from "react-hook-form";

import { FormStep, MultiStepFormContextProps } from "./types";

import { useContext } from "react";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";

import React from "react";
import { IEvent } from "@/lib/schemas/calendar";

import FormFooter from "./form-footer";
import UnsavedChangesDialog from "./dialog-unsaved-changes";

import { ConfirmErrorDialog } from "./dialog-confirm-prompt";

import { useMultiStepFormLogic } from "./use-multi-step-logic";
import { useSession } from "@/contexts/SessionProvider";
import { EventDialog } from "./components/dialog";
import { useEventStore } from "@/lib/zustand/new-event-store-refactor";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TimeInterval } from "@/components/calendar-time-picker/useTimePicker";

export const MultiStepFormContext = createContext<MultiStepFormContextProps | null>(null);

export const MultiStepForm = ({
	formSteps,
	creationDate,
	event,
	userId,
	roomId,

	isOpen,
	onOpenChange,
	minHour,
	maxHour,
	interval,
	maxSpan,
}: {
	formSteps: FormStep[];
	creationDate: Date;
	event?: IEvent;
	userId?: string;
	roomId?: number;
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
	minHour: number;
	maxHour: number;
	interval: TimeInterval;
	maxSpan: number;
}) => {
	console.log("MultiStepForm Render:", { isOpen, event, userId, roomId, creationDate });
	const { session } = useSession();
	//const { isOpen, onClose, onOpen } = useDisclosure();
	const originRef = useRef<HTMLElement | null>(null);

	const logic = useMultiStepFormLogic({
		event,
		roomId,
		creationDate,
		userId,
		formSteps,
		onClose: () => {
			onOpenChange(false);
		},
		isOpen,
		onOpen: () => {
			onOpenChange(true);
		},
		interval,
		minHour,
		maxHour,
	});

	const handleOpenChange = (open: boolean) => {
		if (open) {
			originRef.current = document.activeElement as HTMLElement;

			const storedEvent = useEventStore.getState().event;
			if (storedEvent && !event) {
				logic.setDialogConfig({
					variant: "info",
					title: "Draft Found",
					description: "You have a saved draft. Would you like to edit it?",
					confirmText: "Restore Draft",
					cancelText: "Start New",
					confirmAction: "restore",
					cancelAction: "startNew",
					showCancel: true,
					showConfirm: true,
				});
				return;
			}

			logic.resetForm();
			onOpenChange(true);
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
					showSave: event ? false : true,
				});
			} else {
				logic.resetForm();
				onOpenChange(false);
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
		interval,
		minHour,
		maxHour,
		maxSpan,
	};

	return (
		<MultiStepFormContext.Provider value={contextValue}>
			<Sheet
				open={isOpen}
				onOpenChange={handleOpenChange}
			>
				<SheetContent
					onCloseAutoFocus={e => {
						if (originRef.current) {
							e.preventDefault();
							originRef.current.focus();
						}
					}}
					className="w-full md:w-4xl p-4 flex h-full flex-col min-h-0 overflow-hidden gap-2"
				>
					<SheetHeader className="shrink-0 p-4 border-b">
						<SheetTitle>{contextValue.currentStep.title}</SheetTitle>
						<SheetDescription>
							This form will add an event/appointment to the calendar for the given room and assign it to an individual.
						</SheetDescription>
					</SheetHeader>
					<div className="flex-1 min-h-0 p-4">
						<FormProvider {...logic.methods}>
							<Form className="h-full min-h-0">
								<ScrollArea
									className="h-full min-h-0"
									type="always"
								>
									<div className="w-full min-h-0 pr-4">
										<contextValue.currentStep.component
											formStatus={contextValue.status}
											session={session}
										></contextValue.currentStep.component>
									</div>
									<ScrollBar
										orientation="vertical"
										forceMount
									></ScrollBar>
								</ScrollArea>
							</Form>
						</FormProvider>
					</div>
					<FormFooter userId={userId}></FormFooter>
				</SheetContent>
			</Sheet>
			{logic.dialogConfig && (
				<EventDialog
					variant={logic.dialogConfig.variant}
					isOpen={!!logic.dialogConfig}
					onClose={() => logic.setDialogConfig(null)}
					title={logic.dialogConfig.title}
					description={logic.dialogConfig.description}
					errors={logic.dialogConfig.errors}
					onConfirm={() => logic.handleDialogAction(logic.dialogConfig?.confirmAction)}
					onCancel={() => logic.handleDialogAction(logic.dialogConfig?.cancelAction)}
					onSave={() => logic.handleDialogAction(logic.dialogConfig?.saveAction)}
					confirmText={logic.dialogConfig.confirmText ?? "Confirm"}
					cancelText={logic.dialogConfig.cancelText ?? "Cancel"}
					showSave={logic.dialogConfig.showSave}
					showConfirm={logic.dialogConfig.showConfirm}
					showCancel={logic.dialogConfig.showCancel}
				/>
			)}
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
