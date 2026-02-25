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

import { CombinedSchema } from "./room-drawer.validator";

interface UnsavedChangesDialogProps {
  showAlert: boolean;
  defaultFormValues: CombinedSchema;
  setEvent: () => void;
  resetEvent: () => void;
  resetForm: () => void;
  onClose: () => void;
  setShowAlert: (show: boolean) => void;
}

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  showAlert,
  defaultFormValues,
  setEvent,
  resetEvent,
  resetForm,
  onClose,
  setShowAlert,
}) => (
  <AlertDialog open={showAlert}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Warning: Event Cancellation</AlertDialogTitle>
        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        {defaultFormValues["eventId"] === "0" && (
          <AlertDialogSave
            onClick={() => {
              setEvent();
              setShowAlert(false);
              onClose();
            }}
            className="sm:mr-auto"
          >
            Save for later
          </AlertDialogSave>
        )}
        <AlertDialogAction
          onClick={() => {
            setShowAlert(false);
            resetEvent();
            resetForm();
            onClose();
          }}
          className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
        >
          Dismiss Form
        </AlertDialogAction>

        <AlertDialogCancel onClick={() => setShowAlert(false)}>Continue Editing</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default UnsavedChangesDialog;
