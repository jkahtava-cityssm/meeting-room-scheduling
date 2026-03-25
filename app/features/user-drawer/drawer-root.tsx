import { HomeIcon, UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";

import { IEvent, IUser, SEvent, SUser } from "@/lib/schemas";
import React, { useMemo } from "react";
import { Step1 } from "./drawer-step-event-details";
import { Step2 } from "./drawer-step-event-recurrence";

import { step1Schema } from "./drawer-schema.validator";
import { MultiStepForm } from "./drawer-form-provider";

import { useSession } from "@/contexts/SessionProvider";
import { usePrivateConfigurationQuery } from "@/lib/services/configuration";
import { TimeInterval } from "@/components/calendar-time-picker/useTimePicker";
import { UserDrawerPermissions } from "./lib/permissions";

export default function EventDrawerRefactor({
  creationDate,
  user,
  isOpen,
  onOpen,
  onClose,
}: {
  creationDate: Date;
  user?: IUser;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { can } = UserDrawerPermissions.usePermissions();

  const formSteps: FormStep[] = useMemo(
    () => [
      {
        title: "Step 1: User Details",
        component: Step1,
        icon: UserIcon,
        position: 1,
        validationSchema: step1Schema,
        fields: Object.keys(step1Schema.shape) as FieldKeys[],
      },
    ],
    [],
  );

  const parsedUser = useMemo(() => {
    if (!user) return undefined;
    return SUser.parse(user);
  }, [user]);

  return (
    <MultiStepForm
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      creationDate={creationDate}
      formSteps={formSteps}
      user={parsedUser}
    ></MultiStepForm>
  );
}
