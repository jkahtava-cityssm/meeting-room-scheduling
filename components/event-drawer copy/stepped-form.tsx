import { z, ZodObject, ZodRawShape } from "zod/v4";
import { createContext, useEffect, useState } from "react";
import { Form, FormProvider, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { FormStatus, FormStep, MultiStepFormContextProps } from "./types";
import { CombinedEventSchema, CombinedSchema, defaultValues, getEventValues } from "./event-flow.validator";
import { useContext } from "react";
import PrevButton from "./prevbutton";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, Sheet, SheetTrigger } from "../ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";
import { NextButton } from "./nextbutton";
import { Button } from "../ui/button";
import { ArrowLeftCircle, ArrowRightCircle, CircleX, Loader2Icon, PenBoxIcon, SaveIcon, Trash2 } from "lucide-react";
import { useEventQuery, useEventsMutationDelete, useEventsMutationUpsert } from "@/services/events";
import React from "react";
import { IEvent } from "@/lib/schemas/calendar";
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
} from "../ui/alert-dialog";

export const MultiStepFormContext = createContext<MultiStepFormContextProps | null>(null);

/*const getDefaultValues = (schema: ZodObject<ZodRawShape>) => {
  const schemaKeys = Object.keys(schema.shape);
  const defaultValues: { [key: string]: string } = {};

  for (const key of schemaKeys) {
    defaultValues[key] = "";
  }
  type User = z.infer<typeof CombinedSchema>;

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
  steps,
  event,
  children,
}: {
  steps: FormStep[];
  event?: IEvent;
  children: React.ReactNode;
}) => {
  const defaultFormValues = event ? getEventValues(event) : defaultValues();

  const methods = useForm<CombinedSchema>({
    resolver: zodResolver(CombinedEventSchema),
    defaultValues: defaultFormValues,
  });

  const { isOpen, onToggle, onClose } = useDisclosure();

  const onOpenChange = () => {
    if (methods.formState.isDirty) {
      setShowAlert(true);
      return;
    }

    onDiscardChanges();
  };

  const onDiscardChanges = () => {
    setStatus(defaultFormValues["eventId"] === "0" ? "New" : "Read");
    methods.reset(defaultFormValues);
    onToggle();
  };

  //const default = defaultValues();
  // Form state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [ignoreLastStep, setIgnoreLastStep] = useState(defaultFormValues["isRecurring"] === "false" ? true : false);
  //const [isEditable, setEditable] = useState(false);
  const [status, setStatus] = useState<FormStatus>(defaultFormValues["eventId"] === "0" ? "New" : "Read");
  const [showAlert, setShowAlert] = useState(false);
  const currentStep = steps[currentStepIndex];

  const { error, data: collectedEvent } = useEventQuery(Number(defaultFormValues["eventId"]), status === "Loading");
  const saveButtonEnabled =
    status === "Edit" || status === "New" || (ignoreLastStep && status !== "Read" && status !== "Loading");
  const editButtonEnabled = status === "Read" || status === "Loading";

  const mutationUpsert = useEventsMutationUpsert();
  const mutationDelete = useEventsMutationDelete();

  useEffect(() => {
    if (status === "Loading" && collectedEvent) {
      const data = methods.getValues();
      /*currentStep.fields.forEach((fieldName) => {
        methods.resetField(fieldName);
      });*/
      const parsedData = getEventValues(collectedEvent);
      console.log(parsedData);
      console.log(data);
      console.log(collectedEvent);

      methods.reset(parsedData);

      setTimeout(() => {
        setStatus("Edit");
      }, 250);
    }
  }, [status, collectedEvent]);

  const isFormValid = async (): Promise<boolean> => {
    const isLastStep = !(currentStepIndex < steps.length - 1);

    let isValid = false;

    if (isLastStep) {
      isValid = await methods.trigger(currentStep.fields as (keyof CombinedSchema)[]);
    } else {
      isValid = await methods.trigger(currentStep.fields as (keyof z.infer<typeof currentStep.validationSchema>)[]);
    }
    //const isValid = await methods.trigger(currentStep.fields as (keyof z.infer<typeof CombinedSchema>)[]);

    if (!isValid) {
      return false; // Stop progression if validation fails
    }

    // grab values in current step and transform array to object
    const formValues = getFormValues(currentStepIndex);

    /* const currentStepValues = methods.getValues(currentStep.fields as (keyof CombinedSchema)[]);
    const formValues = Object.fromEntries(
      currentStep.fields.map((field, index) => [field, currentStepValues[index] || ""])
    );*/

    // Validate the form state against the current step's schema
    if (currentStep.validationSchema) {
      const validationResult = currentStep.validationSchema.safeParse(formValues);

      if (!validationResult.success) {
        validationResult.error.issues.forEach((err) => {
          methods.setError(err.path.join(".") as keyof CombinedSchema, {
            type: "manual",
            message: err.message,
          });
        });
        return false; // Stop progression if schema validation fails
      }
    }

    return true;
  };

  // Navigation functions
  const nextStep = async () => {
    const isValid = await isFormValid();
    if (!isValid) return;

    if (currentStepIndex < steps.length - 1 && !ignoreLastStep) {
      // Move to the next step if not at the last step
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

  const onDelete = () => {
    if (defaultFormValues["eventId"] === "0") {
      currentStep.fields.forEach((fieldName) => {
        methods.resetField(fieldName);
      });
      //methods.resetField(currentStep.fields,);
    }
  };

  const onSave = async () => {
    const isValid = await isFormValid();
    if (!isValid) return;

    const allData = methods.getValues();
    const step1Data = getFormValues(0);
    const step2Data = getFormValues(1);

    if (allData.isRecurring === "true") {
      mutationUpsert.mutate(
        { eventData: getFormValues(0), ruleData: getFormValues(0) },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }

    console.log(allData);

    setStatus("Read");
  };

  const getFormValues = (step: number) => {
    const currentStepValues = methods.getValues(steps[step].fields as (keyof CombinedSchema)[]);
    const formValues = Object.fromEntries(
      currentStep.fields.map((field, index) => [field, currentStepValues[index] || ""])
    );

    return formValues;
  };

  /* Form submission function */
  async function submitSteppedForm(data: CombinedSchema) {
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
            <Form>
              <currentStep.component status={status}></currentStep.component>
            </Form>
          </FormProvider>

          <SheetFooter className="flex  md:flex-row  gap-6 ">
            {/*
            <PrevButton />
            <NextButton className="mr-auto" onClick={() => nextStep()} />*/}

            {saveButtonEnabled && (
              <Button
                variant={"default"}
                onClick={() => {
                  onSave();
                }}
                className="md:w-24"
              >
                <SaveIcon />
                Save
              </Button>
            )}
            {editButtonEnabled && (
              <Button
                variant={"default"}
                onClick={() => {
                  setStatus("Loading");
                }}
                className="md:w-24"
                disabled={status === "Loading"}
              >
                {status === "Loading" ? <Loader2Icon className="animate-spin" /> : <PenBoxIcon />}
                Edit
              </Button>
            )}
            <Button variant={"outline"} className="md:w-24" onClick={() => onOpenChange()}>
              <CircleX />
              Cancel
            </Button>

            <div className="flex flex-row md:gap-6 md:grow md:justify-center">
              <Button
                variant={"outline"}
                className="basis-[48%]  mr-auto md:basis-24 md:mr-0"
                disabled={currentStepIndex === 0}
                onClick={() => previousStep()}
              >
                <ArrowLeftCircle />
                Back
              </Button>
              <Button
                variant={"outline"}
                disabled={currentStepIndex === steps.length - 1 || ignoreLastStep}
                onClick={() => nextStep()}
                className="basis-[48%] ml-auto md:basis-24 md:ml-0"
              >
                Next
                <ArrowRightCircle />
              </Button>
            </div>
            <div className="flex flex-row h-9 md:w-24">
              <Button
                variant={"outline"}
                className="grow md:w-24 border-destructive text-destructive hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
                onClick={onDelete}
                hidden={status !== "Edit"}
              >
                <Trash2 />
                Delete
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AlertDialog open={showAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Event Cancellation </AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            {defaultFormValues["eventId"] === "0" && (
              <AlertDialogSave
                onClick={() => /*onSaveReturn(currentForm?.getValues())*/ console.log("SAVE")}
                className="sm:mr-auto"
              >
                Save for later
              </AlertDialogSave>
            )}
            <AlertDialogAction
              onClick={() => {
                setShowAlert(false);
                onDiscardChanges();
              }}
              className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
            >
              Dismiss Form
            </AlertDialogAction>

            <AlertDialogCancel onClick={() => setShowAlert(false)}>Continue Editing</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MultiStepFormContext.Provider>
  );
};

export const useMultiStepForm = () => {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error("useMultiStepForm must be used within MultiStepForm.Provider");
  }
  return context;
};
