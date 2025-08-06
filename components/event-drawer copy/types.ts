import { ZodType } from "zod/v4";

import { LucideIcon } from "lucide-react";
import { CombinedCheckoutType } from "./event-flow.validator";

export type FieldKeys = keyof CombinedCheckoutType;

export type FormStep = {
  title: string;
  position: number;
  validationSchema: ZodType<unknown>;
  component: React.ReactElement;
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
  setIgnoreLastStep: (value: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  steps: FormStep[];
}
