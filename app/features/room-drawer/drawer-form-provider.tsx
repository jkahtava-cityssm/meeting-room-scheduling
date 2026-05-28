import { createContext } from 'react';
import { Form, FormProvider } from 'react-hook-form';

import { FormStep, MultiStepFormContextProps } from './types';

import { useContext } from 'react';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Sheet } from '@/components/ui/sheet';

import React from 'react';
import { IRoom } from '@/lib/schemas';

import { useRoomFormLogic } from './use-multi-step-logic';

import { DrawerDialog } from './components/dialog';
import FormFooter from './form-footer';

export const MultiStepFormContext = createContext<MultiStepFormContextProps | null>(null);

export const MultiStepForm = ({
  formSteps,
  room,
  isOpen,
  onOpen,
  onClose,
}: {
  formSteps: FormStep[];
  room?: IRoom;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) => {
  const logic = useRoomFormLogic({ room, formSteps, isOpen, onOpen, onClose });

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
          className="w-full md:w-4xl p-4"
        >
          <SheetHeader>
            <SheetTitle>{logic.currentStep.title}</SheetTitle>
            <SheetDescription>This form will add a room to available calendars.</SheetDescription>
          </SheetHeader>

          <FormProvider {...logic.methods}>
            <Form>
              <logic.currentStep.component formStatus={logic.status}></logic.currentStep.component>
            </Form>
          </FormProvider>
          <FormFooter></FormFooter>
        </SheetContent>
      </Sheet>
      {logic.dialogConfig && (
        <DrawerDialog
          variant={logic.dialogConfig.variant}
          isOpen={!!logic.dialogConfig}
          onClose={() => logic.setDialogConfig(null)}
          title={logic.dialogConfig.title}
          description={logic.dialogConfig.description}
          errors={logic.dialogConfig.errors}
          onConfirm={() => logic.handleDialogAction(logic.dialogConfig?.confirmAction)}
          onCancel={() => logic.handleDialogAction(logic.dialogConfig?.cancelAction)}
          onSave={() => logic.handleDialogAction(logic.dialogConfig?.saveAction)}
          confirmText={logic.dialogConfig.confirmText ?? 'Confirm'}
          cancelText={logic.dialogConfig.cancelText ?? 'Cancel'}
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
    throw new Error('useMultiStepForm must be used within MultiStepForm.Provider');
  }
  return context;
};
