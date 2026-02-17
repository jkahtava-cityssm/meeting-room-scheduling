import { GenericComboBox } from "@/components/shared/GenericComboBox";
import { useRolesQuery } from "@/lib/services/permissions";

export function RoleComboBox({
  selectedRoleId,
  onRoleChange,
  excludeRoleNames,
  className,
}: {
  selectedRoleId: string | undefined;
  onRoleChange: (value: string) => void;
  excludeRoleNames?: string[];
  className: string;
}) {
  const { isPending, data, error } = useRolesQuery();

  const filteredRoles = excludeRoleNames && data ? data.filter((role) => !excludeRoleNames?.includes(role.name)) : data;

  return (
    <GenericComboBox
      list={filteredRoles}
      selectedValue={selectedRoleId}
      isLoading={isPending}
      isError={!!error}
      loadingLabel={error ? "Error: Collecting Roles" : "Collecting Roles"}
      onSelect={(value) => {
        onRoleChange(value);
      }}
      getId={(role) => role.roleId.toString()}
      getLabel={(role) => role.name}
      className={className}
      isDisabled={false}
      placeholderText={"Select Role"}
      searchText={"Search Roles"}
      noResultText={"No Roles Found"}
    />
  );
}
