"use client";

import { useRoomsQuery } from "@/services/rooms";

export default function EditEvent({ id }: { id: number }) {
  const event = 0;
  const { isPending, error, data, isFetching } = useRoomsQuery(true);

  return (
    <div>
      <div> NOT IMPLEMENTED </div>
    </div>
  );
}
