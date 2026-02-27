import { GenericSelect } from "@/components/shared/generic-select";
import { IconName } from "@/components/ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { useRoomsQuery } from "@/lib/services/rooms";
import { useUsersQuery } from "@/lib/services/users";

export function UserSelect({
  selectedUserId,
  onRoomChange,
  dataInvalid = false,
}: {
  selectedUserId: string;
  onRoomChange: (value: string) => void;
  dataInvalid?: boolean;
}) {
  const { isPending, data, error } = useUsersQuery();

  return (
    <GenericSelect
      list={data}
      selectedValue={selectedUserId}
      isLoading={isPending}
      isError={!!error}
      loadingLabel={error ? "Error: Collecting Members" : "Collecting Members"}
      placeholderText="Select Member"
      onChange={(value) => {
        onRoomChange(value);
      }}
      getId={(user) => user.userId.toString()}
      getLabel={(user) => user.name}
      dataInvalid={dataInvalid}
      className="min-w-60"
    />
  );
}
