import { useRolesQuery } from "@/lib/services/permissions";
import { GenericMultiSelect } from "@/components/shared/generic-multiselect";
import { useRoomPropertyQuery } from "@/lib/services/rooms";

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
	const { isPending, data, error } = useRoomPropertyQuery();

	return (
		<GenericMultiSelect
			list={data}
			selectedValues={selectedPropertyIds}
			isLoading={isPending}
			isDisabled={isDisabled}
			isError={!!error}
			loadingLabel={error ? "Error: Loading Roles" : "Collecting Roles"}
			placeholderText="Select Roles"
			searchText="Search roles..."
			noResultText="No roles found"
			dataInvalid={dataInvalid}
			onValueChange={onPropertyChange}
			getId={property => property.roomPropertyId.toString()}
			getLabel={property => property.property.name}
			className={className}
			maxCount={maxCount}
			hideSelectAll={true}
		/>
	);
}
