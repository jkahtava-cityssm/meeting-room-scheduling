import { GenericComboBox } from "@/components/shared/generic-combobox";
import { useRolesQuery } from "@/lib/services/permissions";

export function RoleComboBox({
  selectedRoleId,
  onRoleChange,
  excludeRoleNames,
  className,
  dataInvalid = false,
}: {
  selectedRoleId: string | undefined;
  onRoleChange: (id: string, label: string) => void;
  excludeRoleNames?: string[];
  className?: string;
  dataInvalid?: boolean;
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
      onSelect={(id, label) => {
        onRoleChange(id, label);
      }}
      getId={(role) => role.roleId.toString()}
      getLabel={(role) => role.name}
      className={className}
      isDisabled={false}
      placeholderText={"Select Role"}
      searchText={"Search Roles"}
      noResultText={"No Roles Found"}
      dataInvalid={dataInvalid}
    />
  );
}
