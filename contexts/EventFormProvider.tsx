"use client";

import { useFormStore } from "@/lib/zustand/event-store";
import { isEmpty } from "lodash";
import { createContext, RefObject, useContext, useEffect, useRef, useState } from "react";
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
  setKeyData: (key: string, value: string, step: number) => void;
  getKeyData: (step: number, key: string) => string | undefined;
  getStepData: (step: number) => object;
  setFormData: (data: object, step?: number) => void;
  getFormData: (schema: z.ZodObject, defaultValues: object) => object;
  incrementStep: (step?: number) => void;
  decrementStep: (step?: number) => void;
  isValidSchema: (schema: z.ZodObject, data: object) => boolean;
  resetForm: () => void;
  isDirtyRef: RefObject<boolean>;
  setDirty: (value: boolean) => void;
}

const EventFormContext = createContext({} as IEventFormContext);

export function EventFormProvider({ children }: { children: React.ReactNode }) {
  const { setSessionFormData, setSessionStep, getSessionState, setSessionKeyData, resetSessionFormData } =
    useFormStore();

  const currentStep = useFormStore((state) => state.currentStep);

  const [isBackVisible, setBackVisible] = useState(false);
  const [isNextVisible, setNextVisible] = useState(false);
  const [isSubmitVisible, setSubmitVisible] = useState(false);

  const isDirtyRef = useRef(false);
  //const [isDirty, setDirty] = useState(false);
  const [currentForm, setCurrentForm] = useState<UseFormReturn<FieldValues, unknown, FieldValues>>();
  //const [currentStep, setCurrentStep] = useState(storedStep);
  const [formId, setFormId] = useState("");

  const getFormData = (schema: z.ZodObject, defaultValues: object) => {
    const state = getSessionState();
    const sessionData = state.localData[currentStep] as { [key: string]: any };

    if (isEmpty(sessionData) || !schema) {
      //setSessionFormData(defaultValues, currentStep);
      return defaultValues;
    }

    const result = schema.safeParse(sessionData);
    console.log(result.error);
    if (result.error) return defaultValues;

    return result.data;
  };

  const setFormData = (data: object, step?: number) => {
    setSessionFormData(data, step ? step : currentStep);
  };

  const isValidSchema = (schema: z.ZodObject, data: object) => {
    const result = schema.safeParse(data);

    if (result.error) return false;

    return true;
  };

  const getKeyData = (step: number, key: string) => {
    const state = getSessionState();
    const sessionData = state.localData[step] as { [key: string]: string | undefined };
    if (isEmpty(sessionData)) return "";

    return sessionData[key];
  };

  const setKeyData = (key: string, value: string, step: number) => {
    const state = getSessionState();
    const sessionData = state.localData[currentStep];

    if (isEmpty(sessionData)) return;

    setSessionKeyData(key, value, step);
  };

  const getStepData = (step: number) => {
    const state = getSessionState();
    const sessionData = state.localData[step];
    if (isEmpty(sessionData)) return {};

    return sessionData;
  };

  const incrementStep = (step?: number) => {
    setSessionStep(step ? step : currentStep + 1);
  };

  const decrementStep = (step?: number) => {
    setSessionStep(step ? step : currentStep - 1);
  };

  const resetForm = () => {
    resetSessionFormData();
  };

  const setDirty = (value: boolean) => {
    isDirtyRef.current = value;
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
        setKeyData,
        getFormData,
        setFormData,
        getKeyData,
        getStepData,
        incrementStep,
        decrementStep,
        isValidSchema,
        resetForm,
        isDirtyRef,
        setDirty,
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
