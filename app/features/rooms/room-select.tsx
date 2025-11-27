import { GenericSelect } from "@/components/shared/GenericSelect";
import { IconName } from "@/components/ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { useRoomsQuery } from "@/services/rooms";

export function RoomSelect({
  selectedRoomId,
  includeAllOption = true,
  onRoomChange,
}: {
  selectedRoomId: string;
  includeAllOption: boolean;
  onRoomChange: (value: string) => void;
}) {
  const { isPending, data } = useRoomsQuery(includeAllOption);

  return (
    <GenericSelect
      list={data}
      selectedValue={selectedRoomId}
      isLoading={isPending}
      loadingLabel="Collecting Rooms"
      onChange={(value) => {
        onRoomChange(value);
      }}
      getId={(room) => room.roomId.toString()}
      getLabel={(room) => room.name}
      getColor={(room) => room.color as TColors}
      getIcon={(room) => room.icon as IconName}
      className="min-w-60"
    />
  );
}
