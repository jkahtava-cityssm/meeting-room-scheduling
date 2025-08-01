import { ZodType } from "zod";

import { LucideIcon } from "lucide-react";
import { CombinedCheckoutType } from "./event-flow.validator";

type FieldKeys = keyof CombinedCheckoutType;

export type FormStep = {
  title: string;
  position: number;
  validationSchema: ZodType<unknown>;
  component: React.ReactElement;
  icon: LucideIcon;
  fields: FieldKeys[];
};

export interface MultiStepFormContextProps {
  currentStep: FormStep;
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  steps: FormStep[];
}
