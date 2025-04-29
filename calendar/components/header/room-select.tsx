import { useCalendar } from "@/calendar/contexts/calendar-context";
import { IconColored } from "@/components/ui/icon-colored";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Asterisk, BookKey } from "lucide-react";

export function RoomSelect() {
  const { rooms, selectedRoomId, setSelectedRoomId } = useCalendar();

  return (
    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
      <SelectTrigger className="flex-1 md:w-48">
        <SelectValue />
      </SelectTrigger>

      <SelectContent align="end">
        <SelectItem value="all">
          <IconColored showBackground={true} color={"zinc"}>
            <Asterisk></Asterisk>
          </IconColored>
          <div className="flex items-center gap-1">All Rooms</div>
        </SelectItem>

        {rooms.map((room) => (
          <SelectItem key={room.id} value={room.id} className="flex-1">
            <div className="flex items-center gap-2">
              <IconColored showBackground={true} color={room.color}>
                <BookKey />
              </IconColored>

              <p className="truncate">{room.name}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
