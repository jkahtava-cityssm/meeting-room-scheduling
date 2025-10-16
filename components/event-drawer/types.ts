import { ZodType } from "zod/v4";

import { LucideIcon } from "lucide-react";
import { CombinedSchema } from "./event-drawer.validator";
import { Session } from "@/lib/auth-client";

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
  currentStep: FormStep;
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  ignoreLastStep: boolean;
  userId?: string;
  setIgnoreLastStep: (value: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  steps: FormStep[];
  startDate: string;
  setStartDate: (value: string) => void;
}

export type FormStatus = "New" | "Read" | "Edit" | "Loading";
