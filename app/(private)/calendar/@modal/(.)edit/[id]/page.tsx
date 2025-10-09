"use client";

import { Modal } from "@/components/ui/modal";
import { useRoomsQuery } from "@/services/rooms";

export default function EditEvent({ id }: { id: number }) {
  const { isPending, error, data, isFetching } = useRoomsQuery(true);
  return (
    <Modal>
      <div> NOT IMPLEMENTED </div>
    </Modal>
  );
}
