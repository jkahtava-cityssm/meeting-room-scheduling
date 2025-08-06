import { z, ZodObject, ZodRawShape } from "zod/v4";
import { createContext, useState } from "react";
import { Form, FormProvider, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { FormStep, MultiStepFormContextProps } from "./types";
import { CombinedCheckoutSchema, defaultValues } from "./event-flow.validator";

export const MultiStepFormContext = createContext<MultiStepFormContextProps | null>(null);

/*const getDefaultValues = (schema: ZodObject<ZodRawShape>) => {
  const schemaKeys = Object.keys(schema.shape);
  const defaultValues: { [key: string]: string } = {};

  for (const key of schemaKeys) {
    defaultValues[key] = "";
  }
  type User = z.infer<typeof CombinedCheckoutSchema>;

  return defaultValues;
};

function getDefaults<Schema extends z.ZodObject>(schema: Schema) {
  const t = Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      if (value instanceof z.ZodDefault) return [key, value.default()];
      return [key, undefined];
    })
  );
  return t;
}
*/
export const MultiStepForm = ({
  onOpenChange,
  isOpen,
  steps,
  children,
}: {
  onOpenChange: (open: boolean) => void;
  isOpen: boolean;
  steps: FormStep[];
  children: React.ReactNode;
}) => {
  const methods = useForm<z.infer<typeof CombinedCheckoutSchema>>({
    resolver: zodResolver(CombinedCheckoutSchema),
    defaultValues: defaultValues(),
  });

  // Form state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [ignoreLastStep, setIgnoreLastStep] = useState(false);

  const currentStep = steps[currentStepIndex];

  // Navigation functions
  const nextStep = async () => {
    const isLastStep = !(currentStepIndex < steps.length - 1);

    let isValid = false;

    if (isLastStep) {
      isValid = await methods.trigger(currentStep.fields as (keyof z.infer<typeof CombinedCheckoutSchema>)[]);
    } else {
      isValid = await methods.trigger(currentStep.fields as (keyof z.infer<typeof currentStep.validationSchema>)[]);
    }
    //const isValid = await methods.trigger(currentStep.fields as (keyof z.infer<typeof CombinedCheckoutSchema>)[]);

    if (!isValid) {
      return; // Stop progression if validation fails
    }

    // grab values in current step and transform array to object
    const currentStepValues = methods.getValues(currentStep.fields as (keyof z.infer<typeof CombinedCheckoutSchema>)[]);
    const formValues = Object.fromEntries(
      currentStep.fields.map((field, index) => [field, currentStepValues[index] || ""])
    );

    // Validate the form state against the current step's schema
    if (currentStep.validationSchema) {
      const validationResult = currentStep.validationSchema.safeParse(formValues);

      if (!validationResult.success) {
        validationResult.error.issues.forEach((err) => {
          methods.setError(err.path.join(".") as keyof z.infer<typeof CombinedCheckoutSchema>, {
            type: "manual",
            message: err.message,
          });
        });
        return; // Stop progression if schema validation fails
      }
    }

    // Move to the next step if not at the last step
    if (currentStepIndex < steps.length - 1 && ignoreLastStep) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const goToStep = (position: number) => {
    if (position >= 0 && position - 1 < steps.length) {
      setCurrentStepIndex(position - 1);
      //saveFormState(position - 1);
    }
  };

  /* Form submission function */
  async function submitSteppedForm(data: z.infer<typeof CombinedCheckoutSchema>) {
    try {
      // Perform your form submission logic here
      console.log("data", data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  }

  // Context value
  const value: MultiStepFormContextProps = {
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1 || ignoreLastStep,
    ignoreLastStep,
    setIgnoreLastStep,
    goToStep,
    nextStep,
    previousStep,
    steps,
  };
  console.log(value.isLastStep, value.ignoreLastStep);
  return (
    <MultiStepFormContext.Provider value={value}>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{children}</SheetTrigger>

        <SheetContent className="w-full md:w-4xl p-4">
          <SheetHeader>
            <SheetTitle>{currentStep.title}</SheetTitle>
            <SheetDescription>
              This form will add an event/appointment to the calendar for the given room and assign it to an individual.
            </SheetDescription>
          </SheetHeader>

          <FormProvider {...methods}>
            <Form>{currentStep.component}</Form>
          </FormProvider>

          <SheetFooter className="flex sm:flex-col-reverse md:flex-row md:justify-end gap-6 ">
            <PrevButton />
            <NextButton onClick={() => nextStep()} />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </MultiStepFormContext.Provider>
  );
};

import { useContext } from "react";
import PrevButton from "./prevbutton";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, Sheet, SheetTrigger } from "../ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";
import { NextButton } from "./nextbutton";

export const useMultiStepForm = () => {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error("useMultiStepForm must be used within MultiStepForm.Provider");
  }
  return context;
};
