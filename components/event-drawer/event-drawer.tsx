import { HomeIcon, UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";
import { Step1 } from "./step1";
import { CombinedSchema, step1Schema, step2Schema } from "./event-flow.validator";
import { MultiStepForm } from "./stepped-form";
import { Step2 } from "./step2";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useEventQuery } from "@/services/events";
import z, { ZodType, ZodObject, ZodRawShape } from "zod/v4";
import { IEvent } from "@/lib/schemas/calendar";

//type FieldKeys = keyof typeof step1Schema.shape;

const getDefaultValues = (object: object | undefined, schema: ZodObject<ZodRawShape>) => {
  const schemaKeys = Object.keys(schema.shape);
  const defaultValues: { [key: string]: string } = {};

  for (const key of schemaKeys) {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      const value = object[key as keyof typeof object];
      defaultValues[key] = value !== undefined && value !== null ? String(value) : "";
    } else {
      defaultValues[key] = "";
    }
  }
  return defaultValues;
};

export default function EventDrawer({
  creationDate,
  event,
  children,
}: {
  creationDate?: Date;
  event?: IEvent;
  children: React.ReactNode;
}) {
  //console.log(Object.keys(step1Schema.shape));

  const checkoutSteps: FormStep[] = [
    {
      title: "Step 1: Event Details",
      component: Step1,
      icon: UserIcon,
      position: 1,
      validationSchema: step1Schema,
      fields: Object.keys(step1Schema.shape) as FieldKeys[],
    },
    {
      title: "Step 2: Recurrence",
      component: Step2,
      icon: HomeIcon,
      position: 2,
      validationSchema: step2Schema,
      fields: Object.keys(step2Schema.shape) as FieldKeys[],
    },
  ];

  return (
    <>
      <MultiStepForm creationDate={creationDate} formSteps={checkoutSteps} event={event}>
        {children}
      </MultiStepForm>
    </>
  );
}
