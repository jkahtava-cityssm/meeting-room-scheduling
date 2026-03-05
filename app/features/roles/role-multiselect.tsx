import { useRolesQuery } from "@/lib/services/permissions";
import { GenericMultiSelect } from "@/components/shared/generic-multiselect";

export function RoleMultiSelect({
  selectedRoleIds,
  onRolesChange,
  excludeRoleNames,
  className,
  dataInvalid = false,
  isDisabled = false,
  maxCount = 3,
}: {
  selectedRoleIds: string[];
  onRolesChange: (ids: string[]) => void;
  excludeRoleNames?: string[];
  className?: string;
  dataInvalid?: boolean;
  isDisabled: boolean;
  maxCount?: number;
}) {
  const { isPending, data, error } = useRolesQuery();

  // Filter the roles based on exclusion list if provided
  const filteredRoles = excludeRoleNames && data ? data.filter((role) => !excludeRoleNames.includes(role.name)) : data;

  return (
    <GenericMultiSelect
      list={filteredRoles}
      selectedValues={selectedRoleIds}
      isLoading={isPending}
      isDisabled={isDisabled}
      isError={!!error}
      loadingLabel={error ? "Error: Loading Roles" : "Collecting Roles"}
      placeholderText="Select Roles to Limit Access"
      placeholderBadge={{ label: "Everyone" }}
      searchText="Search roles..."
      noResultText="No roles found"
      dataInvalid={dataInvalid}
      onValueChange={onRolesChange}
      getId={(role) => role.roleId.toString()}
      getLabel={(role) => role.name}
      className={className}
      maxCount={maxCount}
      hideSelectAll={true}
    />
  );
}
