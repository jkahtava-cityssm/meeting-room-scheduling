import React from "react";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import {
  SaveIcon,
  CalendarPlus,
  Loader2Icon,
  PenBoxIcon,
  CircleX,
  ArrowLeftCircle,
  ArrowRightCircle,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { FormStatus } from "./types";

export interface FormFooterProps {
  status: FormStatus;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isUpdatePending: boolean;
  isDeletePending: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
  previousStepHasError?: boolean;
  nextStepHasError?: boolean;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  setStatus: (status: FormStatus) => void;
  className?: string;
}

const FormFooter = ({
  status,
  canCreate,
  canUpdate,
  canDelete,
  isUpdatePending,
  isDeletePending,
  isFirstStep,
  isLastStep,
  totalSteps,
  previousStepHasError,
  nextStepHasError,
  onSave,
  onDelete,
  onClose,
  onNext,
  onBack,
  setStatus,
  className,
}: FormFooterProps) => {
  const isSaveDisabled = status === "Edit" ? !canUpdate : !canCreate;
  const isDeleteDisabled = !canDelete;

  return (
    <SheetFooter className="flex md:flex-row gap-6">
      {(status === "Edit" || status === "New") && (
        <Button onClick={onSave} disabled={isSaveDisabled || isUpdatePending} className="md:w-24">
          {isUpdatePending ? (
            <Loader2Icon className="animate-spin" />
          ) : status === "Edit" ? (
            <SaveIcon />
          ) : (
            <CalendarPlus />
          )}
          {status === "Edit" ? "Save" : "Create"}
        </Button>
      )}
      {(status === "Read" || status === "Loading") && (
        <Button onClick={() => setStatus("Loading")} disabled={!canUpdate || status === "Loading"} className="md:w-24">
          {status === "Loading" ? <Loader2Icon className="animate-spin" /> : <PenBoxIcon />} Edit
        </Button>
      )}
      <Button variant="outline" className="md:w-24" onClick={onClose}>
        <CircleX />
        Cancel
      </Button>

      <div className={cn("flex flex-row md:gap-6 md:grow md:justify-center", totalSteps === 1 && "invisible")}>
        <Button
          variant={previousStepHasError ? "outline_destructive" : "outline"}
          className="basis-[48%] mr-auto md:basis-24 md:mr-0"
          onClick={onBack}
          disabled={isFirstStep}
        >
          <ArrowLeftCircle /> Back
        </Button>
        <Button
          variant={nextStepHasError ? "outline_destructive" : "outline"}
          className="basis-[48%] ml-auto md:basis-24 md:ml-0"
          onClick={onNext}
          disabled={isLastStep}
        >
          Next <ArrowRightCircle />
        </Button>
      </div>

      <div className={cn("flex flex-row h-9 md:w-24", status !== "Edit" && "invisible")}>
        <Button
          variant="outline_destructive"
          className={"grow md:w-24"}
          onClick={onDelete}
          disabled={isDeleteDisabled || isDeletePending}
          tabIndex={status === "Edit" ? 0 : -1}
        >
          {isDeletePending ? <Loader2Icon className="animate-spin" /> : <Trash2 />}
          Delete
        </Button>
      </div>
    </SheetFooter>
  );
};
export default FormFooter;
