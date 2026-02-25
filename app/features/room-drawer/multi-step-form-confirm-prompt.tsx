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

interface UnsavedChangesDialogProps {
  showError: boolean;
  errors: string[];
  onClose: () => void;
  setShowError: (show: boolean) => void;
}

export const ConfirmErrorDialog = ({ showError, errors, onClose, setShowError }: UnsavedChangesDialogProps) => {
  return (
    <AlertDialog open={showError}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Warning: Errors Found</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="list-disc pl-6 text-sm text-red-600 my-4">
          {errors?.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogSave onClick={() => {}} className="sm:mr-auto">
            Save for later
          </AlertDialogSave>

          <AlertDialogAction
            onClick={() => {
              setShowError(false);
            }}
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
