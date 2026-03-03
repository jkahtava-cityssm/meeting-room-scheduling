import { GenericSelect } from "@/components/shared/generic-select";
import { IconName } from "@/components/ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { useRoomsQuery } from "@/lib/services/rooms";

export function RoomSelect({
  selectedRoomId,
  includeAllOption = true,
  onRoomChange,
  dataInvalid = false,
  isDisabled = false,
}: {
  selectedRoomId: string;
  includeAllOption: boolean;
  onRoomChange: (value: string) => void;
  dataInvalid?: boolean;
  isDisabled?: boolean;
}) {
  const { isPending, data, error } = useRoomsQuery(includeAllOption);

  return (
    <GenericSelect
      list={data}
      selectedValue={selectedRoomId}
      isLoading={isPending}
      isError={!!error}
      loadingLabel={error ? "Error: Collecting Rooms" : "Collecting Rooms"}
      placeholderText="Select Room"
      onChange={(value) => {
        onRoomChange(value);
      }}
      getId={(room) => room.roomId.toString()}
      getLabel={(room) => room.name}
      getColor={(room) => room.color as TColors}
      getIcon={(room) => room.icon as IconName}
      dataInvalid={dataInvalid}
      isDisabled={isDisabled}
      className="min-w-60"
    />
  );
}
