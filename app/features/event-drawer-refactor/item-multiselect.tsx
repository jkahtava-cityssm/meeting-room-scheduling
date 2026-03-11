import { GenericMultiSelect } from "@/components/shared/generic-multiselect";
import { useUsersQuery } from "@/lib/services/users";

export function ItemMultiSelect({
  selectedItemIds,
  onChange,
  className,
  dataInvalid = false,
  isDisabled = false,
  maxCount = 3,
}: {
  selectedItemIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  dataInvalid?: boolean;
  isDisabled: boolean;
  maxCount?: number;
}) {
  const { isPending, data, error } = useUsersQuery();

  return (
    <GenericMultiSelect
      list={data}
      selectedValues={selectedItemIds}
      isLoading={isPending}
      isDisabled={isDisabled}
      isError={!!error}
      loadingLabel={error ? "Error: Loading Users" : "Collecting Users"}
      placeholderText="Select Users to Notify"
      searchText="Search users..."
      noResultText="No users found"
      dataInvalid={dataInvalid}
      onValueChange={onChange}
      getId={(user) => user.userId.toString()}
      getLabel={(user) => user.name}
      className={className}
      maxCount={maxCount}
      hideSelectAll={true}
    />
  );
}
