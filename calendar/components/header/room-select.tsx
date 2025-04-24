import { useCalendar } from "@/calendar/contexts/calendar-context";

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
          <Asterisk></Asterisk>
          <div className="flex items-center gap-1">All Rooms</div>
        </SelectItem>

        {rooms.map((room) => (
          <SelectItem key={room.id} value={room.id} className="flex-1">
            <div className="flex items-center gap-2">
              <BookKey color={room.color}></BookKey>
              <p className="truncate">{room.name}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
