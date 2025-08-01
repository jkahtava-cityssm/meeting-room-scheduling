import { HomeIcon, UserIcon } from "lucide-react";
import { FormStep } from "./types";
import { Step1 } from "./step1";
import { step1Schema, step2Schema } from "./event-flow.validator";
import { MultiStepForm } from "./stepped-form";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@radix-ui/react-alert-dialog";
import { Button } from "react-day-picker";
import { AlertDialogHeader, AlertDialogFooter, AlertDialogSave } from "../ui/alert-dialog";
import { useDisclosure } from "@/hooks/use-disclosure";

export const checkoutSteps: FormStep[] = [
  {
    title: "Step 1: Personal Information",
    component: <Step1 />,
    icon: UserIcon,
    position: 1,
    validationSchema: step1Schema,
    fields: ["email", "firstName", "lastName"],
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
  return (
    <>
      <MultiStepForm steps={checkoutSteps}>{children}</MultiStepForm>
    </>
  );
}
