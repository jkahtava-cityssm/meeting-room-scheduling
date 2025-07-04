"use client";

import { EventFormWizard } from "./dialog-event-form-wizard";

import { EventFormProvider } from "@/contexts/EventFormProvider";

export function AddEventDrawer({
  children,
}: {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
}) {
  return (
    <EventFormProvider>
      <EventFormWizard>{children}</EventFormWizard>
    </EventFormProvider>
  );
}
