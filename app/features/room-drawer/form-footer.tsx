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

import { cn } from "@/lib/utils";
import { useMultiStepForm } from "./drawer-form-provider";
import { RoomDrawerPermissions } from "./lib/permissions";

const FormFooter = () => {
  const ctx = useMultiStepForm();

  const { can, isVerifying } = RoomDrawerPermissions.usePermissions();

  const actions = {
    save: {
      show: ctx.isEditing || ctx.isNew,
      disabled:
        (ctx.isEditing ? !can("UpdateRoom") : !can("CreateRoom")) || ctx.mutationUpsert.isPending || isVerifying,
      label: ctx.isEditing ? "Save" : "Create",
      icon: ctx.isEditing ? <SaveIcon /> : <CalendarPlus />,
      loading: ctx.mutationUpsert.isPending,
    },
    edit: {
      show: ctx.isReadOnly || ctx.isLoading,
      disabled: !can("UpdateRoom") || ctx.isLoading || isVerifying,
      loading: ctx.isLoading,
    },
    delete: {
      show: ctx.isEditing && can("DeleteRoom"),
      disabled: ctx.mutationDelete.isPending || isVerifying,
      loading: ctx.mutationDelete.isPending,
    },
    nav: {
      backVariant: ctx.previousStepHasError ? "outline_destructive" : "outline",
      nextVariant: ctx.nextStepHasError ? "outline_destructive" : "outline",
      show: false,
      isFirst: ctx.isFirstStep,
      isLast: ctx.isLastStep,
    },
  } as const;

  return (
    <SheetFooter className="flex md:flex-row gap-6 border-t">
      {actions.save.show && (
        <Button onClick={ctx.onSave} disabled={actions.save.disabled} className="md:w-24">
          {actions.save.loading ? <Loader2Icon className="animate-spin" /> : actions.save.icon}
          {actions.save.label}
        </Button>
      )}
      {actions.edit.show && (
        <Button onClick={ctx.onEdit} disabled={actions.edit.disabled} className="md:w-24">
          {actions.edit.loading ? <Loader2Icon className="animate-spin" /> : <PenBoxIcon />}
          Edit
        </Button>
      )}
      <Button variant="outline" className="md:w-24" onClick={ctx.onClose}>
        <CircleX />
        Cancel
      </Button>

      <div className={cn("flex flex-row md:gap-6 md:grow md:justify-center", !actions.nav.show && "invisible")}>
        <Button
          variant={actions.nav.backVariant}
          className="basis-[48%] mr-auto md:basis-24 md:mr-0"
          onClick={ctx.previousStep}
          disabled={actions.nav.isFirst}
        >
          <ArrowLeftCircle /> Back
        </Button>
        <Button
          variant={actions.nav.nextVariant}
          className="basis-[48%] ml-auto md:basis-24 md:ml-0"
          onClick={ctx.nextStep}
          disabled={actions.nav.isLast}
        >
          Next <ArrowRightCircle />
        </Button>
      </div>

      <div className={cn("flex flex-row h-9 md:w-24", !actions.delete.show && "invisible")}>
        <Button
          variant="outline_destructive"
          className={"grow md:w-24"}
          onClick={ctx.onDelete}
          disabled={actions.delete.disabled}
          tabIndex={actions.delete.show ? 0 : -1}
        >
          {actions.delete.loading ? <Loader2Icon className="animate-spin" /> : <Trash2 />}
          Delete
        </Button>
      </div>
    </SheetFooter>
  );
};
export default FormFooter;
