import { useCalendar } from "@/contexts/CalendarProvider";
import { IRoom } from "@/lib/interfaces";
import { TColors } from "@/lib/types";
import { IconColored } from "@/components/ui/icon-colored";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoomsWithAll } from "@/services/rooms";
import { Asterisk, BookKey } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";

export function RoomSelect({ onRoomChange }: { onRoomChange: (value: string) => void }) {
  const { selectedRoomId, setSelectedRoomId } = useCalendar();

  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<IRoom[]>([]);

  const fetchRooms = async () => {
    setIsLoading(true);

    const rooms = await getRoomsWithAll();

    setRooms(rooms.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

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
      <SelectTrigger className="flex-1 md:w-60">
        <SelectValue />
      </SelectTrigger>

      <SelectContent align="end">
        {rooms.map((room) => (
          <SelectItem key={room.roomId} value={room.roomId.toString()} className="flex-1">
            <div className="flex items-center gap-2">
              <IconColored
                hideBackground={false}
                color={room.color as TColors}
                showBorder={true}
                children={room.roomId === -1 ? <Asterisk /> : <BookKey />}
              ></IconColored>
              <p className="truncate">{room.name}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
