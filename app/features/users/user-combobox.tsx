import { GenericComboBox } from '@/components/shared/generic-combobox';
import { useUsersQuery } from '@/lib/services/users';

export function UserComboBox({
  selectedUserId,
  onUserChange,
  className,
  dataInvalid = false,
  isDisabled = false,
}: {
  selectedUserId: string | undefined;
  onUserChange: (id: string, label: string) => void;
  className?: string;
  dataInvalid?: boolean;
  isDisabled: boolean;
}) {
  const { isPending, data, error } = useUsersQuery();

  return (
    <GenericComboBox
      list={data}
      selectedValue={selectedUserId}
      isLoading={isPending}
      isError={!!error}
      loadingLabel={error ? 'Error: Collecting Members' : 'Collecting Members'}
      onSelect={(id, label) => {
        onUserChange(id, label);
      }}
      getId={(user) => user.userId.toString()}
      getLabel={(user) => user.name}
      getDescrition={(user) => user.email}
      className={className}
      isDisabled={isDisabled}
      placeholderText={'Select Member'}
      searchText={'Search Members'}
      noResultText={'No Member Found'}
      dataInvalid={dataInvalid}
    />
  );
}
