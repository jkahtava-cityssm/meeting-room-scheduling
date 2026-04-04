import { useRolesQuery } from '@/lib/services/permissions';
import { GenericMultiSelect } from '@/components/shared/generic-multiselect';
import { usePropertyQuery } from '@/lib/services/properties';

export function RoomPropertyMultiSelect({
  selectedPropertyIds,
  onPropertyChange,

  className,
  dataInvalid = false,
  isDisabled = false,
  maxCount = 3,
}: {
  selectedPropertyIds: string[];
  onPropertyChange: (ids: string[]) => void;
  excludeRoleNames?: string[];
  className?: string;
  dataInvalid?: boolean;
  isDisabled: boolean;
  maxCount?: number;
}) {
  const { isPending, data, error } = usePropertyQuery();

  return (
    <GenericMultiSelect
      list={data}
      selectedValues={selectedPropertyIds}
      isLoading={isPending}
      isDisabled={isDisabled}
      isError={!!error}
      loadingLabel={error ? 'Error: Loading Room Properties' : 'Collecting Room Properties'}
      placeholderText="Select Properties"
      searchText="Search Properties..."
      noResultText="No properties found"
      dataInvalid={dataInvalid}
      onValueChange={onPropertyChange}
      getId={(property) => property.propertyId.toString()}
      getLabel={(property) => property.name}
      className={className}
      maxCount={maxCount}
      hideSelectAll={true}
    />
  );
}
