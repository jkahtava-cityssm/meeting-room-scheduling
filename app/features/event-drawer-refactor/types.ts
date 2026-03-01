import { ZodType } from "zod/v4";

import { LucideIcon } from "lucide-react";
import { CombinedSchema } from "./event-drawer-schema.validator";
import { Session } from "@/lib/auth-client";
import { UseFormReturn } from "react-hook-form";

export type FieldKeys = keyof CombinedSchema;

export type FormStep = {
	title: string;
	position: number;
	validationSchema: ZodType<unknown>;
	component: React.FC<{ formStatus: FormStatus; session: Session | null }>;
	icon: LucideIcon;
	fields: FieldKeys[];
	//defaultValues: object;
};

export interface MultiStepFormContextProps {
	steps: FormStep[];
	currentStep: FormStep;
	currentStepIndex: number;
	isFirstStep: boolean;
	isLastStep: boolean;
	goToStep: (step: number) => void;
	nextStep: () => void;
	previousStep: () => void;
	previousStepHasError: boolean;
	nextStepHasError: boolean;

	defaultFormValues: CombinedSchema;
	methods: UseFormReturn<CombinedSchema>;
	status: FormStatus;

	setStatus: (status: FormStatus) => void;
	ignoreLastStep: boolean;
	setIgnoreLastStep: (value: boolean) => void;
	resetForm: () => void;

	userId?: string;
	onSave: () => Promise<void>;
	onDelete: () => void;
	onClose: () => void;

	mutationUpsert: {
		isPending: boolean;
	};
	mutationDelete: {
		isPending: boolean;
	};

	startDate: string;
	setStartDate: (value: string) => void;
	dialogConfig: {
		variant: "warning" | "error" | "info";
		title: string;
		description: string;
		errors?: string[];
		actionType: "dismiss" | "save" | "none" | "restore";
		showSaveForLater: boolean;
		confirmText?: string;
		cancelText?: string;
	} | null;
	setDialogConfig: (config: MultiStepFormContextProps["dialogConfig"]) => void;
	handleDialogAction: (value: "dismiss" | "save" | "none" | "restore") => void;
}

export type FormStatus = "New" | "Read" | "Edit" | "Loading";
