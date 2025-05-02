import { useCalendar } from "@/calendar/contexts/calendar-context";
import { IRoom } from "@/calendar/interfaces";
import { TColors } from "@/calendar/types";
import { IconColored } from "@/components/ui/icon-colored";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { prisma } from "@/prisma";
import { getRooms } from "@/services/rooms";
import { Asterisk, BookKey } from "lucide-react";
import { useEffect, useState } from "react";

export function RoomSelect() {
  const { selectedRoomId, setSelectedRoomId } = useCalendar();

  const [rooms, setRooms] = useState<IRoom[]>([]);

  const fetchEvents = async () => {
    const rooms = await getRooms();

    setRooms(rooms);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
      <SelectTrigger className="flex-1 md:w-48">
        <SelectValue />
      </SelectTrigger>

      <SelectContent align="end">
        <SelectItem value="all">
          <IconColored hideBackground={false} color={"zinc"} showBorder={true} children={<Asterisk />} />

          <div className="flex items-center gap-1">All Rooms</div>
        </SelectItem>

        {rooms.map((room) => (
          <SelectItem key={room.roomId} value={room.roomId.toString()} className="flex-1">
            <div className="flex items-center gap-2">
              <IconColored
                hideBackground={false}
                color={room.color as TColors}
                showBorder={true}
                children={<BookKey />}
              ></IconColored>

              <p className="truncate">{room.name}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
