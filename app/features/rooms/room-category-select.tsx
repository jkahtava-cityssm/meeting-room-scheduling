import { GenericSelect } from '@/components/shared/generic-select';
import { IconName } from '@/components/ui/icon-dynamic';
import { TColors } from '@/lib/types';
import { useRoomCategoryQuery, useRoomsQuery } from '@/lib/services/rooms';
import { useUsersQuery } from '@/lib/services/users';

export function RoomCategorySelect({
  selectedUserId,
  onCategoryChange,
  dataInvalid = false,
  isDisabled = false,
  className = 'min-w-60',
}: {
  selectedUserId: string;
  onCategoryChange: (value: string) => void;
  dataInvalid?: boolean;
  isDisabled?: boolean;
  className?: string;
}) {
  const { isPending, data, error } = useRoomCategoryQuery();

  return (
    <GenericSelect
      list={data}
      selectedValue={selectedUserId}
      isLoading={isPending}
      isError={!!error}
      loadingLabel={error ? 'Error: Collecting Categories' : 'Collecting Categories'}
      placeholderText="Select Category"
      onChange={(value) => {
        onCategoryChange(value);
      }}
      getId={(category) => category.roomCategoryId.toString()}
      getLabel={(category) => category.name}
      dataInvalid={dataInvalid}
      isDisabled={isDisabled}
      className={className}
    />
  );
}
