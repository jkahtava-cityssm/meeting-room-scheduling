import { HomeIcon, UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";
import { Step1 } from "./step1";
import { step1Schema, step2Schema } from "./event-flow.validator";
import { MultiStepForm } from "./stepped-form";

//type FieldKeys = keyof typeof step1Schema.shape;

export const checkoutSteps: FormStep[] = [
  {
    title: "Step 1: Personal Information",
    component: <Step1 />,
    icon: UserIcon,
    position: 1,
    validationSchema: step1Schema,
    //fields: Object.keys(step1Schema.shape) as FieldKeys[],
    fields: [
      "eventId",
      "roomId",
      "description",
      "title",
      "startDate",
      "endDate",
      "recurrenceId",
      "duration",
      "startTime",
      "endTime",
      "isRecurring",
    ],
  },
  {
    title: "Step 2: Address Details",
    component: <Step1 />,
    icon: HomeIcon,
    position: 2,
    validationSchema: step2Schema,
    fields: ["country", "city"],
  },
];

export default function EventDrawer2({ children }: { children: React.ReactNode }) {
  //console.log(Object.keys(step1Schema.shape));
  return (
    <>
      <MultiStepForm steps={checkoutSteps}>{children}</MultiStepForm>
    </>
  );
}
