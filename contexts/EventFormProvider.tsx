"use client";

import { useFormStore } from "@/lib/zustand/new-event-store";
import { isEmpty } from "lodash";
import { createContext, RefObject, useContext, useRef, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import z from "zod/v4";

interface IEventFormContext {
  isBackVisible: boolean;
  setBackVisible: (value: boolean) => void;
  isNextVisible: boolean;
  setNextVisible: (value: boolean) => void;
  isReadOnly: boolean;
  setReadOnly: (value: boolean) => void;
  currentForm: UseFormReturn<any, any, any> | undefined;
  setCurrentForm: (value: UseFormReturn<any, any, any>) => void;
  defaultValues: object[];
  setFormDefaultData: (data: object, step?: number) => void;
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

  //const currentStep = useFormStore((state) => state.currentStep);

  const [isBackVisible, setBackVisible] = useState(false);
  const [isNextVisible, setNextVisible] = useState(false);
  const [isReadOnly, setReadOnly] = useState(false);

  const [defaultValues, setDefaultValues] = useState<object[]>([{}]);
  const formValues = useRef<object[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const isDirtyRef = useRef(false);
  //const [isDirty, setDirty] = useState(false);
  const [currentForm, setCurrentForm] = useState<UseFormReturn<FieldValues, unknown, FieldValues>>();
  //const [currentStep, setCurrentStep] = useState(storedStep);
  const [formId, setFormId] = useState("");

  /*const resetForm = (defaultValues: object) => {
    currentForm?.reset();
  };*
*/
  const getFormData = (schema: z.ZodObject, defaultValues: object) => {
    /* const state = getSessionState();
    const sessionData = state.localData[currentStep] as { [key: string]: any };

    if (isEmpty(sessionData) || !schema) {
      //setSessionFormData(defaultValues, currentStep);
      return defaultValues;
    }
*/
    const result = schema.safeParse(formValues.current[currentStep]);
    //console.log(result.error);
    if (result.error) return defaultValues;

    return result.data;
  };

  const setFormDefaultData = (data: object, step?: number) => {
    const newFormDefaults = defaultValues.map((values, index) => {
      if (index === step ? step : currentStep) {
        return { ...values, data };
      } else {
        return values;
      }
    });
    setDefaultValues(newFormDefaults);
  };

  const setFormData = (data: object, step?: number) => {
    const selectedStep = step == null ? currentStep : step;

    const newFormValues = formValues.current.map((values, index) => {
      if (index === selectedStep) {
        return { ...values, ...data };
      } else {
        return values;
      }
    });

    if (formValues.current.length === 0) {
      newFormValues.push(data);
      //setFormValues([{ ...formValues, ...data }]);
    } else if (selectedStep >= formValues.current.length) {
      newFormValues.push(data);
    }
    formValues.current = newFormValues;
    //setFormValues(newFormValues);

    //setSessionFormData(data, step ? step : currentStep, id);
  };

  const isValidSchema = (schema: z.ZodObject, data: object) => {
    const result = schema.safeParse(data);

    if (result.error) return false;

    return true;
  };

  const getKeyData = (step: number, key: string) => {
    /*const state = getSessionState();
    const sessionData = state.localData[step] as { [key: string]: string | undefined };
    if (isEmpty(sessionData)) return "";

    return sessionData[key];*/
    if (formValues.current.length - 1 !== step) return null;

    const data = formValues.current[step] as { [key: string]: string | undefined };
    return data[key];
  };

  const setKeyData = (key: string, value: string, step: number) => {
    const state = getSessionState();
    const sessionData = state.localData[currentStep];

    if (isEmpty(sessionData)) return;

    setSessionKeyData(key, value, step);
  };

  const getStepData = (step: number) => {
    /*
    const state = getSessionState();
    const sessionData = state.localData[step];
    if (isEmpty(sessionData)) return {};

    return sessionData;*/

    return formValues.current[step];
  };

  const incrementStep = (step?: number) => {
    const value = step == null ? currentStep + 1 : step;
    setCurrentStep(value);
  };

  const decrementStep = (step?: number) => {
    const value = step == null ? currentStep - 1 : step;
    setCurrentStep(value);
  };

  const resetForm = () => {
    formValues.current = [];
    //resetSessionFormData();
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
        isReadOnly,
        setReadOnly,
        currentForm,
        setCurrentForm,
        defaultValues,
        setFormDefaultData,
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
