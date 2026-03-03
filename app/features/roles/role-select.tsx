"use client";
import { GenericSelect } from "@/components/shared/generic-select";
import { IconName } from "@/components/ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { useRolesQuery } from "@/lib/services/permissions";

export function RoleSelect({
  selectedRoleId,
  onRoleChange,
  excludeRoleNames,
  dataInvalid = false,
  isDisabled = false,
}: {
  selectedRoleId: string;
  onRoleChange: (value: string) => void;
  excludeRoleNames?: string[];
  dataInvalid?: boolean;
  isDisabled?: boolean;
}) {
  const { isPending, data, error } = useRolesQuery();

  const filteredRoles = excludeRoleNames && data ? data.filter((role) => !excludeRoleNames?.includes(role.name)) : data;

  return (
    <GenericSelect
      list={filteredRoles}
      selectedValue={selectedRoleId}
      isLoading={isPending}
      isError={!!error}
      loadingLabel={error ? "Error: Collecting Roles" : "Collecting Roles"}
      onChange={(value) => {
        onRoleChange(value);
      }}
      getId={(role) => role.roleId.toString()}
      getLabel={(role) => role.name}
      getColor={(role) => "invisible" as TColors}
      getIcon={(role) => "" as IconName}
      dataInvalid={dataInvalid}
      isDisabled={isDisabled}
      className="min-w-20"
    />
  );
}
