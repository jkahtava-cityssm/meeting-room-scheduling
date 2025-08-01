import { useFormContext } from "react-hook-form";
import { Input } from "../ui/input";
import { NextButton } from "./nextbutton";
import { z } from "zod";
import { useMultiStepForm } from "./stepped-form";
import { step1Schema } from "./event-flow.validator";

export const Step1 = () => {
  const {
    register,
    getValues,
    setError,
    formState: { errors },
  } = useFormContext<z.infer<typeof step1Schema>>();

  const { nextStep } = useMultiStepForm();

  const handleStepSubmit = async () => {
    const { email } = getValues();

    // Simulate check for existing email in the database
    if (email === "test@test.com") {
      setError("email", {
        type: "manual",
        message: "Email already exists in the database. Please use a different email.",
      });
      return;
    }

    // move to the next step
    nextStep();
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Input {...register("email")} placeholder="Email" />
        <Input {...register("firstName")} placeholder="First Name" />
        <Input {...register("lastName")} placeholder="Last Name" />
      </div>
      <NextButton onClick={handleStepSubmit} />
    </div>
  );
};
