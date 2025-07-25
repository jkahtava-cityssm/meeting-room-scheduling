"use client";
import { UpdateEventForm } from "@/components/event-drawer/dialog-event-form-step-1";
import { Modal } from "@/components/ui/modal";
import { useRooms } from "@/hooks/use-rooms";

export default function EditEvent({ id }: { id: number }) {
  const { isLoading: isRoomLoading, rooms } = useRooms();
  return (
    <Modal>
      <UpdateEventForm
        isLoading={isRoomLoading}
        rooms={rooms}
        onSubmit={function (values: IEventForm): Promise<void> {
          throw new Error("Function not implemented.");
        }}
      ></UpdateEventForm>
    </Modal>
  );
}
