import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { SaveIcon, CalendarPlus, Loader2Icon, PenBoxIcon, CircleX, ArrowLeftCircle, ArrowRightCircle, Trash2 } from "lucide-react";
import { useVerifySessionRequirement, Session } from "@/lib/auth-client";
import { FormStatus, FormStep } from "./types";
import { GroupedPermissionRequirement } from "@/lib/auth-permission-checks";
import { useSession } from "@/contexts/SessionProvider";
import { useMultiStepForm } from "./multi-step-form-shell";
import { cn } from "@/lib/utils";
import { EvendDrawerPermissions } from "./lib/permissions";

const PAGE_PERMISSIONS = {
	UpdateEvent: {
		type: "permission",
		resource: "Event",
		action: "Update",
	},
	CreateEvent: {
		type: "permission",
		resource: "Event",
		action: "Create",
	},
} as const satisfies GroupedPermissionRequirement;

const FormFooter = ({ userId }: { userId?: string }) => {
	const ctx = useMultiStepForm();

	const { can, isVerifying } = EvendDrawerPermissions.usePermissions();

	const isEditEnabled = can("UpdateEvent");
	const isSaveEnabled = ctx.status === "Edit" ? can("UpdateEvent") : can("CreateEvent");
	const isDeleteEnabled = can("DeleteEvent");

	return (
		<SheetFooter className="flex md:flex-row gap-6">
			{(ctx.status === "Edit" || ctx.status === "New") && (
				<Button
					onClick={ctx.onSave}
					disabled={!isSaveEnabled || ctx.mutationUpsert.isPending}
					className="md:w-24"
				>
					{ctx.mutationUpsert.isPending ? <Loader2Icon className="animate-spin" /> : ctx.status === "Edit" ? <SaveIcon /> : <CalendarPlus />}
					{ctx.status === "Edit" ? "Save" : "Create"}
				</Button>
			)}
			{(ctx.status === "Read" || ctx.status === "Loading") && (
				<Button
					onClick={() => ctx.setStatus("Loading")}
					disabled={!isEditEnabled || ctx.status === "Loading"}
					className="md:w-24"
				>
					{ctx.status === "Loading" ? <Loader2Icon className="animate-spin" /> : <PenBoxIcon />} Edit
				</Button>
			)}
			<Button
				variant="outline"
				className="md:w-24"
				onClick={ctx.onClose}
			>
				<CircleX />
				Cancel
			</Button>

			<div className="flex flex-row md:gap-6 md:grow md:justify-center">
				<Button
					variant={ctx.previousStepHasError ? "outline_destructive" : "outline"}
					className="basis-[48%] mr-auto md:basis-24 md:mr-0"
					onClick={ctx.previousStep}
					disabled={ctx.isFirstStep}
				>
					<ArrowLeftCircle /> Back
				</Button>
				<Button
					variant={ctx.nextStepHasError ? "outline_destructive" : "outline"}
					className="basis-[48%] ml-auto md:basis-24 md:ml-0"
					onClick={ctx.nextStep}
					disabled={ctx.isLastStep}
				>
					Next <ArrowRightCircle />
				</Button>
			</div>

			<div className={cn("flex flex-row h-9 md:w-24", ctx.status !== "Edit" && "invisible")}>
				<Button
					variant="outline_destructive"
					className={"grow md:w-24"}
					onClick={ctx.onDelete}
					disabled={!isDeleteEnabled || ctx.mutationDelete.isPending}
					tabIndex={ctx.status === "Edit" ? 0 : -1}
				>
					{ctx.mutationDelete.isPending ? <Loader2Icon className="animate-spin" /> : <Trash2 />}
					Delete
				</Button>
			</div>
		</SheetFooter>
	);
};
export default FormFooter;
