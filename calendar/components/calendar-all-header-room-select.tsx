import { useCalendar } from "@/calendar/contexts/calendar-context";
import { IRoom } from "@/calendar/interfaces";
import { TColors } from "@/calendar/types";
import { IconColored } from "@/components/ui/icon-colored";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRoomsWithAll } from "@/services/rooms";
import { Asterisk, BookKey } from "lucide-react";
import { useEffect, useState } from "react";

export function RoomSelect() {
  const { selectedRoomId, setSelectedRoomId } = useCalendar();

  const [rooms, setRooms] = useState<IRoom[]>([]);

  const fetchRooms = async () => {
    const rooms = await getRoomsWithAll();

    setRooms(rooms.data);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <Select value={selectedRoomId.toString()} onValueChange={setSelectedRoomId}>
      <SelectTrigger className="flex-1 md:w-48">
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
