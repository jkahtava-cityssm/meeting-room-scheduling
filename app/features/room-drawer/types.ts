import { ZodType } from 'zod/v4';

import { LucideIcon } from 'lucide-react';
import { CombinedSchema } from './drawer-schema.validator';
import { Session } from '@/lib/auth-client';
import { UseFormReturn } from 'react-hook-form';
import { RefObject } from 'react';

export type FieldKeys = keyof CombinedSchema;

export type FormStep = {
  title: string;
  position: number;
  validationSchema: ZodType<unknown>;
  component: React.FC<{ formStatus: FormStatus }>;
  icon: LucideIcon;
  fields: FieldKeys[];
  //defaultValues: object;
};

export interface MultiStepFormContextProps {
  isNew: boolean;
  isEditing: boolean;
  isReadOnly: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;

  //Navigation
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

  //Form
  defaultFormValues: CombinedSchema;
  methods: UseFormReturn<CombinedSchema>;
  status: FormStatus;
  setStatus: (status: FormStatus) => void;

  //Actions
  onSave: () => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  resetForm: () => void;
  mutationUpsert: {
    isPending: boolean;
  };
  mutationDelete: {
    isPending: boolean;
  };

  //Dialog
  dialogConfig: {
    variant: 'warning' | 'error' | 'info';
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
  setDialogConfig: (config: MultiStepFormContextProps['dialogConfig']) => void;
  handleDialogAction: (value: ButtonActions) => void;
  handleOpenChange: (value: boolean) => void;
  //
  originRef: RefObject<HTMLElement | null>;
}

export type ButtonActions = 'dismiss' | 'none' | undefined;

export type FormStatus = 'New' | 'Read' | 'Edit' | 'Loading';
