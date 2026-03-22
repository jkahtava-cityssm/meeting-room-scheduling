import { GenericMultiSelect } from "@/components/shared/generic-multiselect";
import { useUsersQuery } from "@/lib/services/users";

export function UserMultiSelect({
	selectedUserIds,
	onChange,
	excludeUserIds,
	className,
	dataInvalid = false,
	isDisabled = false,
	maxCount = 3,
}: {
	selectedUserIds: string[];
	onChange: (ids: string[]) => void;
	excludeUserIds: string[];
	className?: string;
	dataInvalid?: boolean;
	isDisabled: boolean;
	maxCount?: number;
}) {
	const { isPending, data, error } = useUsersQuery();

	const filteredUsers = excludeUserIds && data ? data.filter(user => !excludeUserIds.includes(String(user.userId))) : data;

	return (
		<GenericMultiSelect
			list={filteredUsers}
			selectedValues={selectedUserIds}
			isLoading={isPending}
			isDisabled={isDisabled}
			isError={!!error}
			loadingLabel={error ? "Error: Loading Users" : "Collecting Users"}
			placeholderText="Select Users to Notify"
			searchText="Search users..."
			noResultText="No users found"
			dataInvalid={dataInvalid}
			onValueChange={onChange}
			getId={user => user.userId.toString()}
			getLabel={user => user.name}
			className={className}
			hideSelectAll={true}
		/>
	);
}
