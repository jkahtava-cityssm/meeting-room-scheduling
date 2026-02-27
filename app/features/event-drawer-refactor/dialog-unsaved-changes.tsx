import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogSave,
} from "@/components/ui/alert-dialog";

import { useMultiStepForm } from "./step-0-form";
import { useEventStore } from "@/lib/zustand/new-event-store-refactor";

interface UnsavedChangesDialogProps {
  showAlert: boolean;
  setShowAlert: (show: boolean) => void;
  onClose: () => void;
}
const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({ showAlert, setShowAlert, onClose }) => {
  const { methods, resetForm, defaultFormValues } = useMultiStepForm();
  const { setEvent, resetEvent } = useEventStore();

  const handleSaveForLater = () => {
    setEvent(methods.getValues());
    setShowAlert(false);
    onClose();
  };

  const handleDismiss = () => {
    setShowAlert(false);
    resetEvent();
    resetForm();
    onClose();
  };
  return (
    <AlertDialog open={showAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Warning: Event Cancellation</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {defaultFormValues["eventId"] === "0" && (
            <AlertDialogSave onClick={handleSaveForLater} className="sm:mr-auto">
              Save for later
            </AlertDialogSave>
          )}
          <AlertDialogAction
            onClick={handleDismiss}
            className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
          >
            Dismiss Form
          </AlertDialogAction>

          <AlertDialogCancel onClick={() => setShowAlert(false)}>Continue Editing</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UnsavedChangesDialog;
