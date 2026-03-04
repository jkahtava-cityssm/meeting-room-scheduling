import { ZodType } from "zod/v4";

import { LucideIcon } from "lucide-react";
import { CombinedSchema } from "./room-drawer-schema.validator";
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

  dialogConfig: {
    variant: "warning" | "error" | "info";
    title: string;
    description: string;
    errors?: string[];
    cancelAction?: ButtonActions;
    confirmAction?: ButtonActions;
    saveAction?: ButtonActions;
    showCancel?: boolean;
    showConfirm?: boolean;
    showSave?: boolean;
    confirmText?: string;
    cancelText?: string;
  } | null;
  setDialogConfig: (config: MultiStepFormContextProps["dialogConfig"]) => void;
  handleDialogAction: (value: ButtonActions) => void;
}

export type ButtonActions = "dismiss" | "none" | undefined;

export type FormStatus = "New" | "Read" | "Edit" | "Loading";
