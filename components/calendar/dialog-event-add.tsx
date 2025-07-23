"use client";

import { IEvent } from "@/lib/schemas/calendar";
import { EventFormWizard } from "./dialog-event-form-wizard";

import { EventFormProvider } from "@/contexts/EventFormProvider";

export function AddEventDrawer({
  children,
  startDate,
  event,
}: {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
  event?: IEvent;
}) {
  return (
    <EventFormProvider>
      <EventFormWizard defaultevent={event} defaultStartDate={startDate}>
        {children}
      </EventFormWizard>
    </EventFormProvider>
  );
}
