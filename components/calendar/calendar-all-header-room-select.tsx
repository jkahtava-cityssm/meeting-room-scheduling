import { useCalendar } from "@/contexts/CalendarProvider";

import { TColors } from "@/lib/types";
import { IconColored } from "@/components/ui/icon-colored";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Asterisk, BookKey } from "lucide-react";

import { Skeleton } from "../ui/skeleton";
import { useRoomsQuery } from "@/services/rooms";
import DynamicIcon, { IconName } from "../ui/icon-dynamic";
import { Badge } from "../ui/badge";
import { BadgeColored } from "../ui/badge-colored";

export function RoomSelect({
  selectedRoomId,
  onRoomChange,
}: {
  selectedRoomId: string;
  onRoomChange: (value: string) => void;
}) {
  //const { selectedRoomId } = useCalendar();

  const { isPending, data } = useRoomsQuery(true);

  /*useEffect(() => {
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
  }, [data]);*/

  if (isPending || !data) {
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
        {data.map((room) => (
          <SelectItem key={room.roomId} value={room.roomId.toString()} className="flex-1 w-full ">
            <div className="flex items-center gap-2 w-full text-sm">
              <BadgeColored color={room.color as TColors} className="h-6 w-6">
                <DynamicIcon
                  hideBackground={true}
                  color={room.color as TColors}
                  name={room.icon as IconName}
                ></DynamicIcon>
              </BadgeColored>
              {room.name}

              {/*
              <DynamicIcon
                hideBackground={false}
                color={room.color as TColors}
                name={room.icon as IconName}
              ></DynamicIcon>
              <p className="truncate">{room.name}</p>



              <IconColored hideBackground={false} color={room.color as TColors} showBorder={true}>
                {room.roomId === -1 ? <Asterisk /> : <BookKey />}
              </IconColored>
              
              */}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
