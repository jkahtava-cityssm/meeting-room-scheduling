import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import {
  SaveIcon,
  CalendarPlus,
  Loader2Icon,
  PenBoxIcon,
  CircleX,
  ArrowLeftCircle,
  ArrowRightCircle,
  Trash2,
} from "lucide-react";
import { useVerifySessionRequirement, Session } from "@/lib/auth-client";
import { FormStatus, FormStep } from "./types";
import { GroupedPermissionRequirement } from "@/lib/auth-permission-checks";
import { useSession } from "@/contexts/SessionProvider";
import { useMultiStepForm } from "./multi-step-form-shell";

const PAGE_PERMISSIONS = {
  UpdateEvent: {
    type: "permission",
    resource: "Event",
    action: "Update",
  },
  CreateEvent: {
    type: "permission",
    resource: "Event",
    action: "Create",
  },
} as const satisfies GroupedPermissionRequirement;

const FormFooter = ({ userId }: { userId?: string }) => {
  const { session } = useSession();
  const ctx = useMultiStepForm();
  const { permissions } = useVerifySessionRequirement(session, PAGE_PERMISSIONS);

  const isSaveDisabled = ctx.status === "Edit" ? !permissions.UpdateEvent : !permissions.CreateEvent;

  return (
    <SheetFooter className="flex md:flex-row gap-6">
      {ctx.status !== "Read" && (
        <Button onClick={ctx.onSave} disabled={isSaveDisabled || ctx.mutationUpsert.isPending}>
          {ctx.mutationUpsert.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          {ctx.status === "Edit" ? "Save" : "Create"}
        </Button>
      )}

      {ctx.status === "Read" && (
        <Button onClick={() => ctx.setStatus("Loading")} disabled={!permissions.UpdateEvent}>
          <PenBoxIcon /> Edit
        </Button>
      )}

      <div className="flex gap-4 grow justify-center">
        <Button
          variant={ctx.previousStepHasError ? "outline_destructive" : "outline"}
          onClick={ctx.previousStep}
          disabled={ctx.isFirstStep}
        >
          <ArrowLeftCircle /> Back
        </Button>
        <Button
          variant={ctx.nextStepHasError ? "outline_destructive" : "outline"}
          onClick={ctx.nextStep}
          disabled={ctx.isLastStep}
        >
          Next <ArrowRightCircle />
        </Button>
      </div>

      {ctx.status === "Edit" && (
        <Button variant="destructive" onClick={() => ctx.onDelete()} disabled={ctx.mutationDelete.isPending}>
          <Trash2 /> Delete
        </Button>
      )}
    </SheetFooter>
  );
};
export default FormFooter;
