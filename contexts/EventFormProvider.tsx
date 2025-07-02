"use client";

import { useFormStore } from "@/lib/zustand/event-store";
import { isEmpty } from "lodash";
import { createContext, useContext, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import z from "zod/v4";

interface IEventFormContext {
  isBackVisible: boolean;
  setBackVisible: (value: boolean) => void;
  isNextVisible: boolean;
  setNextVisible: (value: boolean) => void;
  isSubmitVisible: boolean;
  setSubmitVisible: (value: boolean) => void;
  currentForm: UseFormReturn<any, any, any> | undefined;
  setCurrentForm: (value: UseFormReturn<any, any, any>) => void;
  currentStep: number;
  //setCurrentStep: (value: number) => void;
  formId: string;
  setFormId: (value: string) => void;
  getFormData: (schema: z.ZodObject, defaultValues: object) => object;
  handleNext: (data: object) => void;
  handleBack: (data: object) => void;
}

const EventFormContext = createContext({} as IEventFormContext);

export function EventFormProvider({ children }: { children: React.ReactNode }) {
  const { setSessionFormData, setSessionStep, getSessionState } = useFormStore();

  const currentStep = useFormStore((state) => state.currentStep);

  const [isBackVisible, setBackVisible] = useState(false);
  const [isNextVisible, setNextVisible] = useState(false);
  const [isSubmitVisible, setSubmitVisible] = useState(false);
  const [currentForm, setCurrentForm] = useState<UseFormReturn<FieldValues, unknown, FieldValues>>();
  //const [currentStep, setCurrentStep] = useState(storedStep);
  const [formId, setFormId] = useState("");

  const getFormData = (schema: z.ZodObject, defaultValues: object) => {
    const state = getSessionState();
    const sessionData = state.localData[currentStep];

    if (isEmpty(sessionData) || !schema) return defaultValues;

    const result = schema.safeParse(sessionData);
    if (result.error) return defaultValues;

    return result.data;
  };

  const handleNext = (data: object) => {
    setSessionFormData(data, currentStep);
    setSessionStep(currentStep + 1);
  };

  const handleBack = (data: object) => {
    setSessionFormData(data, currentStep);
    setSessionStep(currentStep - 1);
  };

  return (
    <EventFormContext.Provider
      value={{
        isBackVisible,
        setBackVisible,
        isNextVisible,
        setNextVisible,
        isSubmitVisible,
        setSubmitVisible,
        currentForm,
        setCurrentForm,
        currentStep,
        //setCurrentStep,
        formId,
        setFormId,
        getFormData,
        handleNext,
        handleBack,
      }}
    >
      {children}
    </EventFormContext.Provider>
  );
}

export function useEventForm(): IEventFormContext {
  const context = useContext(EventFormContext);
  if (!context) throw new Error("useEventForm must be used within a EventFormProvider.");
  return context;
}
