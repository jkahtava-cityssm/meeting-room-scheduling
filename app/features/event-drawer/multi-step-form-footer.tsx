import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { SaveIcon, CalendarPlus, Loader2Icon, PenBoxIcon, CircleX, ArrowLeftCircle, ArrowRightCircle, Trash2 } from "lucide-react";
import { useVerifySessionRequirement, Session } from "@/lib/auth-client";
import { FormStatus, FormStep } from "./types";

type FormFooterProps = {
	saveButtonEnabled: boolean;
	editButtonEnabled: boolean;
	status: FormStatus;
	session: Session | null;
	userId?: string;
	onSave: () => void;
	onOpenChange: (open: boolean) => void;
	currentStepIndex: number;
	formSteps: FormStep[];
	ignoreLastStep: boolean;
	previousStep: () => void;
	nextStep: () => void;
	backButtonDestructive?: boolean;
	nextButtonDestructive?: boolean;
	onDelete: () => void;
	setStatus: (status: FormStatus) => void;
};

const FormFooter: React.FC<FormFooterProps> = ({
	saveButtonEnabled,
	editButtonEnabled,
	status,
	session,
	userId,
	onSave,
	onOpenChange,
	currentStepIndex,
	formSteps,
	ignoreLastStep,
	previousStep,
	nextStep,
	backButtonDestructive,
	nextButtonDestructive,
	onDelete,
	setStatus,
}) => {
	const canUpdateEvent = useVerifySessionRequirement(session, { type: "permission", resource: "Event", action: "Update" });
	const canCreateEvent = useVerifySessionRequirement(session, { type: "permission", resource: "Event", action: "Create" });

	const isSaveDisabled = useMemo(() => {
		if (status === "Edit") return !canUpdateEvent;
		if (status === "New") return !canCreateEvent || !userId;
		return false;
	}, [status, canUpdateEvent, canCreateEvent, userId]);

	const isEditDisabled = useMemo(() => {
		return status === "Loading" || !canUpdateEvent;
	}, [status, canUpdateEvent]);

	return (
		<SheetFooter className="flex md:flex-row gap-6">
			{saveButtonEnabled && (
				<Button
					variant="default"
					onClick={onSave}
					className="md:w-24"
					disabled={isSaveDisabled}
				>
					{status === "Edit" ? <SaveIcon /> : <CalendarPlus />}
					{status === "Edit" ? "Save" : "Create"}
				</Button>
			)}

			{editButtonEnabled && (
				<Button
					variant="default"
					onClick={() => setStatus("Loading")}
					className="md:w-24"
					disabled={isEditDisabled}
				>
					{status === "Loading" ? <Loader2Icon className="animate-spin" /> : <PenBoxIcon />}
					Edit
				</Button>
			)}

			<Button
				variant="outline"
				className="md:w-24"
				onClick={() => onOpenChange(false)}
			>
				<CircleX />
				Cancel
			</Button>

			<div className="flex flex-row md:gap-6 md:grow md:justify-center">
				<Button
					variant={backButtonDestructive ? "outline_destructive" : "outline"}
					className="basis-[48%] mr-auto md:basis-24 md:mr-0"
					disabled={currentStepIndex === 0}
					onClick={previousStep}
				>
					<ArrowLeftCircle />
					Back
				</Button>
				<Button
					variant={nextButtonDestructive ? "outline_destructive" : "outline"}
					disabled={currentStepIndex === formSteps.length - 1 || ignoreLastStep}
					onClick={nextStep}
					className="basis-[48%] ml-auto md:basis-24 md:ml-0"
				>
					Next
					<ArrowRightCircle />
				</Button>
			</div>

			{status === "Edit" && (
				<div className="flex flex-row h-9 md:w-24">
					<Button
						variant="outline_destructive"
						className="grow md:w-24"
						onClick={onDelete}
					>
						<Trash2 />
						Delete
					</Button>
				</div>
			)}
		</SheetFooter>
	);
};

export default FormFooter;
