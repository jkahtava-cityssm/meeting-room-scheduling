"use client"
import { GenericSelect } from "@/components/shared/GenericSelect";
import { IconName } from "@/components/ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { useRolesQuery } from "@/lib/services/permissions";

export function RoleSelect({
	selectedRoleId,
	onRoleChange,
	excludeRoleNames,
}: {
	selectedRoleId: string;
	onRoleChange: (value: string) => void;
	excludeRoleNames?: string[];
}) {
	const { isPending, data, error } = useRolesQuery();

	const filteredRoles = excludeRoleNames && data ? data.filter(role => !excludeRoleNames?.includes(role.name)) : data;

	return (
		<GenericSelect
			list={filteredRoles}
			selectedValue={selectedRoleId}
			isLoading={isPending}
			isError={!!error}
			loadingLabel={error ? "Error: Collecting Roles" : "Collecting Roles"}
			onChange={value => {
				onRoleChange(value);
			}}
			getId={role => role.roleId.toString()}
			getLabel={role => role.name}
			getColor={role => "invisible" as TColors}
			getIcon={role => "" as IconName}
			className="min-w-20"
		/>
	);
}
