import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogSave,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import React, { useCallback, useState } from "react";
import { useMultiStepForm } from "./multi-step-form-shell";
import { useEventStore } from "@/lib/zustand/new-event-store-refactor";

interface UnsavedChangesDialogProps {
  showError: boolean;
  errors: string[];
  onClose: () => void;
  setShowError: (show: boolean) => void;
}

export const ConfirmErrorDialog = ({ showError, errors, onClose, setShowError }: UnsavedChangesDialogProps) => {
  const { methods, resetForm, defaultFormValues } = useMultiStepForm();
  const { setEvent, resetEvent } = useEventStore();

  const handleSaveForLater = () => {
    setEvent(methods.getValues());
    setShowError(false);
    onClose();
  };

  const handleDismiss = () => {
    setShowError(false);
    resetEvent();
    resetForm();
    onClose();
  };
  return (
    <AlertDialog open={showError}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Invalid Event Data</AlertDialogTitle>
          <AlertDialogDescription>Please fix the following errors:</AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="list-disc pl-6 text-sm text-red-600 my-4">
          {errors?.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogSave onClick={handleSaveForLater} className="sm:mr-auto">
            Save for later
          </AlertDialogSave>

          <AlertDialogAction
            onClick={handleDismiss}
            className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
          >
            Dismiss Form
          </AlertDialogAction>

          <AlertDialogCancel onClick={() => setShowError(false)}>Continue Editing</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
