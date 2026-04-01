import { z } from "zod/v4";
import { createContext, useMemo, useRef, useState } from "react";
import { Form, FormProvider } from "react-hook-form";

import { FormStep, MultiStepFormContextProps } from "./types";

import { useContext } from "react";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useDisclosure } from "@/hooks/use-disclosure";

import React from "react";
import { IEventSingleRoom } from "@/lib/schemas";

import FormFooter from "./form-footer";

import { useMultiStepFormLogic } from "./use-multi-step-logic";
import { useSession } from "@/contexts/SessionProvider";
import { EventDialog } from "./components/dialog";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TimeInterval } from "@/components/calendar-time-picker/useTimePicker";
import { EventDrawerPermissions } from "./lib/permissions";
import { CombinedSchema } from "./drawer-schema.validator";

export const MultiStepFormContext = createContext<MultiStepFormContextProps | null>(null);

export const MultiStepForm = ({
  formSteps,
  creationDate,
  event,
  draft,
  userId,
  roomId,
  isOpen,
  onOpen,
  onClose,
  minHour,
  maxHour,
  interval,
  maxSpan,
}: {
  formSteps: FormStep[];
  creationDate: Date;
  event?: IEventSingleRoom;
  draft?: CombinedSchema;
  userId?: string;
  roomId?: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  minHour: number;
  maxHour: number;
  interval: TimeInterval;
  maxSpan: number;
}) => {
  const { session } = useSession();
  //const { isOpen, onClose, onOpen } = useDisclosure();

  const { can } = EventDrawerPermissions.usePermissions();

  const logic = useMultiStepFormLogic({
    event,
    draft,
    roomId,
    creationDate,
    userId,
    formSteps,
    isOpen,
    onOpen,
    onClose,
    interval,
    minHour,
    maxHour,
    maxSpan,
    restrictHours: !can("IgnoreHours"),
  });

  return (
    <MultiStepFormContext.Provider value={logic}>
      <Sheet open={isOpen} onOpenChange={logic.handleOpenChange}>
        <SheetContent
          onCloseAutoFocus={(e) => {
            if (logic.originRef.current) {
              e.preventDefault();
              logic.originRef.current.focus();
            }
          }}
          className="w-full md:w-4xl p-4 flex h-full flex-col min-h-0 overflow-hidden gap-2"
        >
          <SheetHeader className="shrink-0 p-4 border-b">
            <SheetTitle>{logic.currentStep.title}</SheetTitle>
            <SheetDescription>
              This form will add an event/appointment to the calendar for the given room and assign it to an individual.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0 p-4">
            <FormProvider {...logic.methods}>
              <Form className="h-full min-h-0">
                <ScrollArea className="h-full min-h-0" type="always">
                  <div className="w-full min-h-0 pr-4">
                    <logic.currentStep.component
                      formStatus={logic.status}
                      session={session}
                    ></logic.currentStep.component>
                  </div>
                  <ScrollBar orientation="vertical" forceMount></ScrollBar>
                </ScrollArea>
              </Form>
            </FormProvider>
          </div>
          <FormFooter userId={userId}></FormFooter>
        </SheetContent>
      </Sheet>
      {logic.dialogConfig && (
        <EventDialog
          variant={logic.dialogConfig.variant}
          isOpen={!!logic.dialogConfig}
          onClose={() => logic.setDialogConfig(null)}
          title={logic.dialogConfig.title}
          description={logic.dialogConfig.description}
          errors={logic.dialogConfig.errors}
          onConfirm={() => logic.handleDialogAction(logic.dialogConfig?.confirmAction)}
          onCancel={() => logic.handleDialogAction(logic.dialogConfig?.cancelAction)}
          onSave={() => logic.handleDialogAction(logic.dialogConfig?.saveAction)}
          confirmText={logic.dialogConfig.confirmText ?? "Confirm"}
          cancelText={logic.dialogConfig.cancelText ?? "Cancel"}
          showSave={logic.dialogConfig.showSave}
          showConfirm={logic.dialogConfig.showConfirm}
          showCancel={logic.dialogConfig.showCancel}
        />
      )}
    </MultiStepFormContext.Provider>
  );
};

export const useMultiStepForm = () => {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error("useMultiStepForm must be used within MultiStepForm.Provider");
  }
  return context;
};
