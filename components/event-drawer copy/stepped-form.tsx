import { z } from "zod";
import { createContext, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { FormStep, MultiStepFormContextProps } from "./types";
import { CombinedCheckoutSchema } from "./event-flow.validator";

export const MultiStepFormContext = createContext<MultiStepFormContextProps | null>(null);

export const MultiStepForm = ({ steps, children }: { steps: FormStep[]; children: React.ReactNode }) => {
  const { isOpen, onToggle } = useDisclosure();

  const onOpenChange = (open: boolean) => {
    onToggle();
  };

  const methods = useForm<z.infer<typeof CombinedCheckoutSchema>>({
    resolver: zodResolver(CombinedCheckoutSchema),
  });

  // Form state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];

  // Navigation functions
  const nextStep = async () => {
    const isValid = await methods.trigger(currentStep.fields as (keyof z.infer<typeof CombinedCheckoutSchema>)[]);

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
        validationResult.error.errors.forEach((err) => {
          methods.setError(err.path.join(".") as keyof z.infer<typeof CombinedCheckoutSchema>, {
            type: "manual",
            message: err.message,
          });
        });
        return; // Stop progression if schema validation fails
      }
    }

    // Move to the next step if not at the last step
    if (currentStepIndex < steps.length - 1) {
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
    isLastStep: currentStepIndex === steps.length - 1,
    goToStep,
    nextStep,
    previousStep,
    steps,
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent className="w-full md:w-4xl p-4">
        <SheetHeader>
          <SheetTitle>{currentStep.title}</SheetTitle>
          <SheetDescription>
            This form will add an event/appointment to the calendar for the given room and assign it to an individual.
          </SheetDescription>
        </SheetHeader>
        <MultiStepFormContext.Provider value={value}>
          <FormProvider {...methods}>
            <div className="w-[550px] mx-auto">
              <form onSubmit={methods.handleSubmit(submitSteppedForm)}>
                {currentStep.component}
                <PrevButton />
              </form>
            </div>
          </FormProvider>
        </MultiStepFormContext.Provider>

        <SheetFooter className="flex sm:flex-col-reverse md:flex-row md:justify-end gap-6 "></SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

import { useContext } from "react";
import PrevButton from "./prevbutton";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, Sheet, SheetTrigger } from "../ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";

export const useMultiStepForm = () => {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error("useMultiStepForm must be used within MultiStepForm.Provider");
  }
  return context;
};
