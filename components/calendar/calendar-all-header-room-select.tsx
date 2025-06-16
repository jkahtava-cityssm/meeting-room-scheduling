import { useCalendar } from "@/contexts/CalendarProvider";

import { TColors } from "@/lib/types";
import { IconColored } from "@/components/ui/icon-colored";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Asterisk, BookKey } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import useSWR from "swr";
import { IRoom } from "@/lib/schemas/calendar";

export function RoomSelect({ onRoomChange }: { onRoomChange: (value: string) => void }) {
  const { selectedRoomId } = useCalendar();

  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<IRoom[]>([]);

  const { data } = useSWR<IRoom[]>(`/api/rooms`);

  useEffect(() => {
    if (data) {
      const allRooms: IRoom = {
        roomId: -1,
        color: "slate",
        icon: "Asterisk",
        name: "All Rooms",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setRooms([allRooms, ...data]);
      setIsLoading(false);
    }
  }, [data]);

  if (isLoading) {
    return <Skeleton className="flex w-fit items-center justify-between gap-2 shrink-0 h-9 flex-1 md:w-60"></Skeleton>;
  }

  return (
    <Select
      value={selectedRoomId.toString()}
      onValueChange={(value) => {
        onRoomChange(value);
      }}
    >
      <SelectTrigger className="flex-1 h-2 min-w-60 w-full ">
        <SelectValue />
      </SelectTrigger>

      <SelectContent align="end">
        {rooms.map((room) => (
          <SelectItem key={room.roomId} value={room.roomId.toString()} className="flex-1">
            <div className="flex items-center gap-2">
              <IconColored hideBackground={false} color={room.color as TColors} showBorder={true}>
                {room.roomId === -1 ? <Asterisk /> : <BookKey />}
              </IconColored>
              <p className="truncate">{room.name}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
