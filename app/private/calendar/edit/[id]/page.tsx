"use client";
import { IEventForm, UpdateEventForm } from "@/components/calendar/dialog-event-form";
import { useRooms } from "@/hooks/use-rooms";

export default function EditEvent({ id }: { id: number }) {
  const event = 0;
  const { isLoading: isRoomLoading, rooms } = useRooms();

  return (
    <div>
      <UpdateEventForm
        isLoading={isRoomLoading}
        rooms={rooms}
        onSubmit={function (values: IEventForm): Promise<void> {
          throw new Error("Function not implemented.");
        }}
      ></UpdateEventForm>
    </div>
  );
}
