"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { ReadEvent } from "./dialog-event-details-read";
import { EditEvent } from "./dialog-event-details-edit";
import { getEvent } from "@/services/events";
import { getRooms } from "@/services/rooms";
import { setTimeout } from "timers";
import { EditEventSkeleton } from "./skeleton-dialog-edit-event";
import { IEvent, IRoom } from "@/lib/schemas/calendar";

export function EventDetailsDialog({ event, children }: { event: IEvent; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const [title, setTitle] = useState(event.title);

  const onDialogChange = () => {
    setIsOpen((currentValue) => !currentValue);

    setIsEditable(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onDialogChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[calc(100%-2rem)] lg:max-w-9/12 lg:max-h-9/12">
          <DialogHeader className="md:text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">Event Details</DialogDescription>
          </DialogHeader>
          {isEditable && <EditEvent eventId={event.eventId} setTitle={setTitle} setIsEditable={setIsEditable} />}
          {!isEditable && <ReadEvent event={event} setIsEditable={setIsEditable} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
