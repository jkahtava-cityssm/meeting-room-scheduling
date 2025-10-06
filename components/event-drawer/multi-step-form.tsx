import { z } from "zod/v4";
import { createContext, useEffect, useState } from "react";
import { Form, FormProvider, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { FormStatus, FormStep, MultiStepFormContextProps } from "./types";
import {
  CombinedEventSchema,
  CombinedSchema,
  step1Schema,
  step2Schema,
  eventObject,
  ruleObject,
  defaultValues,
  getEventValues,
} from "./event-drawer.validator";
import { useContext } from "react";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, Sheet, SheetTrigger } from "../ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";
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

export const MultiStepForm = ({
  formSteps,
  creationDate,
  event,
  userId,
  children,
}: {
  formSteps: FormStep[];
  creationDate?: Date;
  event?: IEvent;
  userId?: string;
  children: React.ReactNode;
}) => {
  const defaultFormValues = event ? getEventValues(event) : defaultValues(creationDate, userId);

  const methods = useForm<CombinedSchema>({
    resolver: zodResolver(CombinedEventSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  //https://react-hook-form.com/docs/useform
  //const { reset, trigger, setError, getValues } = methods;

  //console.log(defaultFormValues);
  const { isOpen, onClose, onOpen } = useDisclosure();

  //const default = defaultValues();
  // Form state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [ignoreLastStep, setIgnoreLastStep] = useState(defaultFormValues["isRecurring"] === "false" ? true : false);
  //const [isEditable, setEditable] = useState(false);
  const [status, setStatus] = useState<FormStatus>(defaultFormValues["eventId"] === "0" ? "New" : "Read");
  const [showAlert, setShowAlert] = useState(false);
  const currentStep = formSteps[currentStepIndex];
  const [nextButtonDestructive, setNextButtonDestructive] = useState(false);
  const [backButtonDestructive, setBackButtonDestructive] = useState(false);

  const { data: collectedEvent } = useEventQuery(Number(defaultFormValues["eventId"]), status === "Loading");
  const saveButtonEnabled =
    status === "Edit" || status === "New" || (ignoreLastStep && status !== "Read" && status !== "Loading");
  const editButtonEnabled = status === "Read" || status === "Loading";

  const mutationUpsert = useEventsMutationUpsert();
  const mutationDelete = useEventsMutationDelete();

  useEffect(() => {
    if (status === "Loading" && collectedEvent) {
      const parsedData = getEventValues(collectedEvent);
      methods.reset(parsedData);

      setTimeout(() => {
        setStatus("Edit");
      }, 100);
    }
    //Complains about methods.reset but it is a function and should not be included
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, collectedEvent]);

  const isStepValid = async (formStep: FormStep): Promise<boolean> => {
    let isValid = false;

    isValid = await methods.trigger(formStep.fields as (keyof z.infer<typeof formStep.validationSchema>)[]);

    if (!isValid) {
      return false; // Stop progression if validation fails
    }

    // grab values in current step and transform array to object
    const formValues = getFormValues(formStep.position - 1);

    // Validate the form state against the current step's schema
    if (formStep.validationSchema) {
      const validationResult = formStep.validationSchema.safeParse(formValues);

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

  const isFormValid = async (): Promise<boolean> => {
    const totalSteps = formSteps.length - 1;
    let isValid = true;

    for (let step = 0; step <= totalSteps; step++) {
      const stepValid = await isStepValid(formSteps[step]);
      console.log("Step ", step, " valid: ", stepValid);

      if (stepValid) {
        continue;
      }

      isValid = false;
    }

    return isValid;
  };

  // Navigation functions
  const nextStep = async () => {
    //const isValid = await isStepValid(currentStep);

    //if (!isValid) return;

    if (currentStepIndex < formSteps.length - 1 && !ignoreLastStep) {
      // Move to the next step if not at the last step
      setCurrentStepIndex(currentStepIndex + 1);

      const isCurrentStepValid = await isStepValid(formSteps[currentStepIndex]);
      //const isNextStepValid = await isStepValid(formSteps[currentStepIndex + 1]);

      if (!isCurrentStepValid) {
        setBackButtonDestructive(true);
      } else if (backButtonDestructive === true) {
        setBackButtonDestructive(false);
      }

      if (formSteps.length - 1 === currentStepIndex + 1) {
        setNextButtonDestructive(false);
      }
    }
  };

  const previousStep = async () => {
    //if (!isValid) return;

    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);

      const isCurrentStepValid = await isStepValid(formSteps[currentStepIndex]);
      //const isPreviousStepValid = await isStepValid(formSteps[currentStepIndex - 1]);

      if (!isCurrentStepValid) {
        setNextButtonDestructive(true);
      } else if (nextButtonDestructive === true) {
        setNextButtonDestructive(false);
      }

      if (0 === currentStepIndex - 1) {
        setBackButtonDestructive(false);
      }
    }
  };

  const goToStep = (position: number) => {
    if (position >= 0 && position - 1 < formSteps.length) {
      setCurrentStepIndex(position - 1);
      //saveFormState(position - 1);
    }
  };

  const onDelete = () => {
    if (defaultFormValues["eventId"] === "0") {
      resetForm();
    } else {
      mutationDelete.mutate(Number(defaultFormValues["eventId"]), {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const onSave = async () => {
    const isValid = await isFormValid();
    if (!isValid) return;

    const allData = methods.getValues();
    const step1Data = getFormValues<typeof step1Schema>(0);
    const step2Data = getFormValues<typeof step2Schema>(1);

    const b = z.safeParse(eventObject, step1Data);
    const c = z.safeParse(ruleObject, step2Data);

    if (allData.isRecurring === "true" && b.success && c.success) {
      mutationUpsert.mutate(
        { eventData: b.data, ruleData: c.data },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );
    } else if (allData.isRecurring === "false" && b.success) {
      mutationUpsert.mutate(
        { eventData: b.data, ruleData: null },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
          onError: () => {},
        }
      );
    }

    //console.log(allData);

    //setStatus("Read");
  };

  const onOpenChange = (open: boolean) => {
    if (open) {
      onOpenDrawer();
    } else {
      onCloseDrawer();
    }
  };

  const onCloseDrawer = () => {
    if (methods.formState.isDirty) {
      setShowAlert(true);
      return;
    }
    resetForm();
    onClose();
  };

  const onOpenDrawer = () => {
    resetForm();
    onOpen();
  };

  const resetForm = () => {
    setStatus(defaultFormValues["eventId"] === "0" ? "New" : "Read");
    setCurrentStepIndex(0);
    setIgnoreLastStep(defaultFormValues["isRecurring"] === "false" ? true : false);
    setNextButtonDestructive(false);
    setBackButtonDestructive(false);
    methods.reset(defaultFormValues);
  };

  const getFormValues = <T,>(step: number) => {
    const currentStepValues = methods.getValues(formSteps[step].fields as (keyof CombinedSchema)[]);
    const formValues = Object.fromEntries(
      formSteps[step].fields.map((field, index) => [field, currentStepValues[index] || ""])
    );

    return formValues as T;
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
    currentStep: formSteps[currentStepIndex],
    currentStepIndex,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === formSteps.length - 1 || ignoreLastStep,
    ignoreLastStep,
    userId,
    setIgnoreLastStep,
    goToStep,
    nextStep,
    previousStep,
    formSteps,
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
            <Button variant={"outline"} className="md:w-24" onClick={() => onOpenChange(false)}>
              <CircleX />
              Cancel
            </Button>

            <div className="flex flex-row md:gap-6 md:grow md:justify-center">
              <Button
                variant={backButtonDestructive ? "outline_destructive" : "outline"}
                className="basis-[48%]  mr-auto md:basis-24 md:mr-0"
                disabled={currentStepIndex === 0}
                onClick={() => previousStep()}
              >
                <ArrowLeftCircle />
                Back
              </Button>
              <Button
                variant={nextButtonDestructive ? "outline_destructive" : "outline"}
                disabled={currentStepIndex === formSteps.length - 1 || ignoreLastStep}
                onClick={() => nextStep()}
                className={"basis-[48%] ml-auto md:basis-24 md:ml-0"}
              >
                Next
                <ArrowRightCircle />
              </Button>
            </div>
            <div className="flex flex-row h-9 md:w-24">
              <Button
                variant={"outline_destructive"}
                className="grow md:w-24"
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
    </MultiStepFormContext.Provider>
  );
};

function filterObjectByShape<T>(obj: any): T {
  const newObj: Partial<T> = {}; // Start with an empty object with a partial type
  for (const key in typeDef) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Check if the property exists in the original object
      // and if its type matches the desired type (optional, but good for runtime validation)
      // For a more robust check, you might compare `typeof obj[key]` with the expected type.
      newObj[key] = obj[key];
    }
  }
  return newObj as T; // Cast the new object to the desired type
}

export const useMultiStepForm = () => {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error("useMultiStepForm must be used within MultiStepForm.Provider");
  }
  return context;
};
