"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Text, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditEventDialog } from "@/calendar/components/dialogs/edit-event-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { IEvent, IRoom } from "@/calendar/interfaces";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useEffect, useState } from "react";
import { ReadEvent } from "./read-event";
import { EditEvent } from "./edit-event";
import { getEvent } from "@/services/events";
import { getRooms } from "@/services/rooms";
import { setTimeout } from "timers";
import { EditEventSkeleton } from "./edit-event-skeleton";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
  fetchData: () => Promise<void>;
}

export function EventDetailsDialog({ event, children, fetchData }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const [isLoading, setLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<IEvent>();
  const [rooms, setRooms] = useState<IRoom[]>([]);

  const onToggle = () => setIsOpen((currentValue) => !currentValue);

  //const currentEvent = event; //event.parentEvent == null ? event : event.parentEvent;

  const onDialogChange = () => {
    setIsOpen((currentValue) => !currentValue);

    setIsEditable(false);
  };

  const fetchSingleEvent = async () => {
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
    if (isEditable) {
      console.log("Editable");
      fetchSingleEvent();
    }
  }, [isEditable]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onDialogChange}>
        {" "}
        {
          //modal={false}
        }
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
