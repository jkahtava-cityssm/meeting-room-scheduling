"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { IEvent, IRoom } from "@/lib/interfaces";
import { useEffect, useState } from "react";
import { ReadEvent } from "./dialog-event-details-read";
import { EditEvent } from "./dialog-event-details-edit";
import { getEvent } from "@/services/events";
import { getRooms } from "@/services/rooms";
import { setTimeout } from "timers";
import { EditEventSkeleton } from "./skeleton-dialog-edit-event";

export function EventDetailsDialog({
  event,
  children,
  fetchData,
}: {
  event: IEvent;
  children: React.ReactNode;
  fetchData: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<IEvent>();
  const [rooms, setRooms] = useState<IRoom[]>([]);

  const onDialogChange = () => {
    setIsOpen((currentValue) => !currentValue);

    setIsEditable(false);
  };

  const fetchSingleEvent = async () => {
    if (!isEditable) {
      return;
    }

    setLoading(true);

    const eventList = await getEvent(event.eventId);
    const roomList = await getRooms();

    setTimeout(() => {
      setRooms(roomList.data);
      setCurrentEvent(eventList.data[0]);
      setLoading(false);
    }, 4000);
  };

  useEffect(() => {
    fetchSingleEvent();
  }, [isEditable]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onDialogChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[calc(100%-2rem)] lg:max-w-9/12 lg:max-h-9/12">
          <DialogHeader className="md:text-left">
            <DialogTitle>
              {isEditable && currentEvent !== undefined && !isLoading ? "Edit: " + currentEvent.title : event.title}
            </DialogTitle>
            <DialogDescription className="sr-only">Event Details</DialogDescription>
          </DialogHeader>
          {isEditable && isLoading && <EditEventSkeleton></EditEventSkeleton>}
          {isEditable && currentEvent !== undefined && !isLoading && (
            <EditEvent event={currentEvent} rooms={rooms} fetchData={fetchData} setIsEditable={setIsEditable} />
          )}
          {!isEditable && <ReadEvent event={event} setIsEditable={setIsEditable} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
