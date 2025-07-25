"use client";

import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BookKey } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { IconColored } from "@/components/ui/icon-colored";

import { TColors } from "@/lib/types";

import { getDurationText } from "@/lib/helpers";

import { IEvent, IRoom } from "@/lib/schemas/calendar";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

import { Label } from "../ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface IEventForm
  extends Pick<IEvent, "eventId" | "roomId" | "description" | "title" | "startDate" | "endDate" | "recurrenceId"> {
  duration: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
}

export function ReadEventForm({
  event,
  rooms,
}: //getDefaultValues,
{
  event?: IEvent;
  rooms?: IRoom[];
  //getDefaultValues: (event: IEvent) => typeof SEventReloadSchema;
}) {
  const SEventFormDefaults = {
    eventId: event?.eventId,
    roomId: event?.roomId,
    title: event?.title,
    description: event?.description,
    startDate: event?.startDate,
    startTime: event?.startDate,
    endDate: event?.endDate,
    endTime: event?.endDate,
    duration: event ? getDurationText(event.startDate, event.startDate, event.endDate, event.endDate) : "",
    isRecurring: event?.recurrenceId ? true : false,
    recurrenceId: event?.recurrenceId,
  };

  return (
    <>
      <ScrollArea type="always">
        <div className="max-h-[calc(80dvh)] w-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col flex-1 gap-4 py-4">
              <div className="flex flex-col xs:flex-row items-start gap-4">
                <ControlContainer>
                  <Label id="roomLabel" htmlFor="room">
                    Room
                  </Label>

                  <Select defaultValue={SEventFormDefaults.roomId?.toString()}>
                    <SelectTrigger className="min-w-52" readonly={true}>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>

                    <SelectContent className="min-w-52">
                      {rooms?.map((room) => {
                        return (
                          <SelectItem key={room.roomId} value={room.roomId?.toString()} className="flex-1">
                            <div className="flex items-center gap-2">
                              <IconColored color={room.color as TColors} showBorder={false} hideBackground={true}>
                                <BookKey />
                              </IconColored>

                              <p className="truncate">{room.name}</p>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </ControlContainer>
                <ControlContainer className="xs:justify-items-center">
                  <Label htmlFor="isRecurring">Event Type</Label>
                  <Tabs defaultValue={String(SEventFormDefaults.isRecurring)}>
                    <TabsList className="gap-2">
                      <TabsTrigger value="false" readonly={true}>
                        One Time
                      </TabsTrigger>
                      <TabsTrigger value="true" readonly={true}>
                        Multiple/Recurring
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </ControlContainer>
              </div>
              <ControlContainer>
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter a title" defaultValue={SEventFormDefaults.title} readOnly={true} />
              </ControlContainer>
              <ControlContainer>
                <Label htmlFor="startDate">Start Date</Label>

                <Input
                  id="startDate"
                  placeholder="START DATE TIME"
                  defaultValue={
                    SEventFormDefaults.startDate
                      ? format(SEventFormDefaults.startDate, "yyyy-MM-dd HH:mm aa")
                      : "Error: No Start Date Found"
                  }
                  readOnly={true}
                  //disabled={true}
                  //className="disabled:opacity-100 border-0"
                />
              </ControlContainer>
              <ControlContainer>
                <Label htmlFor="endDate">End Date</Label>

                <Input
                  id="endDate"
                  placeholder="END DATE TIME"
                  defaultValue={
                    SEventFormDefaults.endDate
                      ? format(SEventFormDefaults.endDate, "yyyy-MM-dd @ HH:mm aa")
                      : "Error: No End Date Found"
                  }
                  readOnly={true}
                />
              </ControlContainer>

              <ControlContainer>
                <Label htmlFor="duration">Duration:</Label>
                <Input
                  id="duration"
                  className="text-sm h-9 px-3 py-1 content-center"
                  defaultValue={SEventFormDefaults.duration}
                  readOnly={true}
                ></Input>
              </ControlContainer>
            </div>
            <div className="flex flex-col flex-1 gap-4 py-4">
              <ControlContainer>
                <Label>Description</Label>

                <Textarea
                  className="max-h-70 min-h-70 resize-none"
                  id="description"
                  defaultValue={SEventFormDefaults.description || ""}
                  readOnly={true}
                ></Textarea>
              </ControlContainer>
            </div>
          </div>
        </div>
        <ScrollBar orientation="vertical" forceMount></ScrollBar>
      </ScrollArea>
    </>
  );
}

function ControlContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("grid gap-2", className)}>{children}</div>;
}
