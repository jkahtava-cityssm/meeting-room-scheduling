"use client";
import { useFormStore } from "@/lib/zustand/event-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { isEmpty } from "lodash";
import { useState } from "react";

import { DefaultValues, FieldValues, useForm } from "react-hook-form";
import { z } from "zod/v4";

interface UseFormStepProps<T extends FieldValues> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodObject;
  defaultValues: object;
  currentStep: number;
}

export function useFormStep<T extends FieldValues>({ schema, defaultValues, currentStep }: UseFormStepProps<T>) {
  const { setCurrentStep, setFormData, getLatestState } = useFormStore();

  /*const form = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: "onChange",
    defaultValues: getLatestState().formData as DefaultValues<T>,
  });
*/

  const getFormData = () => {
    const state = getLatestState();
    return getValue(state.localData[currentStep]);
  };

  const getValue = (data: object) => {
    return isEmpty(data) ? defaultValues : schema.parse(data);
  };

  const handleNext = (data: T) => {
    setFormData(data, currentStep);
    setCurrentStep(currentStep + 1);
  };
  const handleNextOveride = (data: T, overideStep: number) => {
    setFormData(data, overideStep);
    setCurrentStep(overideStep);
  };
  const handleBack = (data: T) => {
    setFormData(data, currentStep);
    setCurrentStep(currentStep - 1);
  };
  return { getFormData, setFormData, handleNext, handleBack, handleNextOveride };
}
