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

import type { IEvent } from "@/calendar/interfaces";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useState } from "react";
import { ReadEvent } from "./read-event";
import { EditEvent } from "./edit-event";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  const onToggle = () => setIsOpen((currentValue) => !currentValue);

  const currentEvent = event.parentEvent === null ? event : event.parentEvent;

  const onDialogChange = () => {
    console.log("RUN");
    setIsOpen((currentValue) => !currentValue);

    setIsReadOnly(true);
  };

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
            <DialogTitle>{currentEvent.title}</DialogTitle>
            <DialogDescription className="sr-only">Event Details</DialogDescription>
          </DialogHeader>
          {isReadOnly ? <ReadEvent event={currentEvent} /> : <EditEvent event={currentEvent} />}

          <DialogFooter className="sm:flex-col-reverse md:flex-row md:justify-end">
            {isReadOnly ? (
              <Button type="button" variant="outline" onClick={() => setIsReadOnly(false)}>
                Edit2
              </Button>
            ) : (
              <>
                <Button form="event-form" type="submit">
                  Save changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsReadOnly(true)}>
                  Cancel
                </Button>
              </>
            )}

            {/*<EditEventDialog event={currentEvent}>
              <Button type="button" variant="outline">
                Edit
              </Button>
            </EditEventDialog>*/}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
