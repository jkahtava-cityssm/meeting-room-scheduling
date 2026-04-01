import { GenericMultiSelect } from "@/components/shared/generic-multiselect";
import { IconName } from "@/components/ui/icon-dynamic";
import { useRoomsQuery } from "@/lib/services/rooms";
import { TColors } from "@/lib/types";

export function RoomMultiSelect({
  selectedRoomIds,
  onChange,
  excludeRoomIds,
  className,
  dataInvalid = false,
  isDisabled = false,
  maxCount = 3,
  hideSelectAll = false,
}: {
  selectedRoomIds: string[];
  onChange: (ids: string[]) => void;
  excludeRoomIds: string[];
  className?: string;
  dataInvalid?: boolean;
  isDisabled: boolean;
  maxCount?: number;
  hideSelectAll: boolean;
}) {
  const { isPending, data, error } = useRoomsQuery(false);

  const availableRooms = data ? data.filter((room) => !excludeRoomIds.includes(String(room.roomId))) : [];

  const effectiveSelection = selectedRoomIds.includes("-1")
    ? [...availableRooms.map((room) => String(room.roomId))]
    : selectedRoomIds;

  return (
    <GenericMultiSelect
      list={availableRooms}
      selectedValues={effectiveSelection}
      isLoading={isPending}
      isDisabled={isDisabled}
      isError={!!error}
      loadingLabel={error ? "Error: Loading Status" : "Collecting Status"}
      placeholderText="Select Status"
      searchText="Search Status..."
      noResultText="No status found"
      dataInvalid={dataInvalid}
      onValueChange={onChange}
      getId={(room) => room.roomId.toString()}
      getLabel={(room) => room.name}
      getIcon={(room) => room.icon as IconName}
      getColor={(room) => room.color as TColors}
      className={className}
      selectAllBadge={{ label: "All Rooms", value: "-1", color: "zinc", icon: "asterisk" }}
      hideSelectAll={hideSelectAll}
      hideIcon={false}
      hideClearAll={true}
      hideClearSingle={true}
      hideMoreLabel={true}
    />
  );
}
