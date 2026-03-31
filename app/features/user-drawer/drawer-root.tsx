import { UserIcon } from "lucide-react";
import { FieldKeys, FormStep } from "./types";

import { IUser, SUser } from "@/lib/schemas";
import React, { useMemo } from "react";
import { Step1 } from "./drawer-step-user-details";

import { step1Schema } from "./drawer-schema.validator";
import { MultiStepForm } from "./drawer-form-provider";

import { UserDrawerPermissions } from "./lib/permissions";

export default function UserDrawer({
  user,
  isOpen,
  onOpen,
  onClose,
}: {
  user?: IUser;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
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
      formSteps={formSteps}
      user={parsedUser}
    ></MultiStepForm>
  );
}
