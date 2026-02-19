import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { GenericSelect } from "@/components/shared/GenericSelect";
import { ComboBox, ComboBoxTrigger } from "@/components/ui/combobox";
import { usePermissionUserQuery, useRolesQuery } from "@/lib/services/permissions";
import { GenericComboBox } from "@/components/shared/GenericComboBox";
import { RoleComboBox } from "../roles/role-combobox";
import { useUsersQuery } from "@/lib/services/users";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import React from "react";

export interface Employee {
	id: number;
	name: string;
	email: string;
	employeeNumber: number;
}

interface EmployeeTableSectionProps {
	onToggleAssigned: (id: number, next: boolean) => void;
}

interface UserFilters {
	name: string;
	email: string;
	employeeNumber: string;
	department: string[];
	status: string[];
	assigned: string[];
}

const STATUS_OPTIONS = [
	{ label: "Enabled", value: "true" },
	{ label: "Disabled", value: "false" },
];

const ASSIGNED_OPTIONS = [
	{ label: "Assigned", value: "true" },
	{ label: "Not Assigned", value: "false" },
];

export function PermissionGroupList({ onToggleAssigned }: EmployeeTableSectionProps) {
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
	const [currentRole, setCurrentRole] = useState<string | undefined>(undefined);

	const [filters, setFilters] = useState<UserFilters>({
		name: "",
		email: "",
		employeeNumber: "",
		department: [],
		status: [],
		assigned: [],
	});

	const { data } = usePermissionUserQuery(currentRole);

	const departmentList = useMemo(() => {
		return data ? getDistinctValuesByKey(data, "department") : [];
	}, [data]);

	const debouncedFilters = useDebounce(filters, 300);

	const filteredEmployee = useMemo(() => {
		if (!data) return [];

		return data.filter(user => {
			// Check every active filter. If any filter doesn't match, exclude the user (AND logic).
			return Object.entries(debouncedFilters).every(([key, filterValue]) => {
				if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;

				let mappedValue: string;

				if (key === "status") mappedValue = String(user.employeeActive);
				else if (key === "assigned") mappedValue = String(user.isAssigned);
				else mappedValue = String(user[key as keyof typeof user] || "").toLowerCase();

				if (Array.isArray(filterValue)) {
					return filterValue.some(v => v.toLowerCase() === mappedValue);
				}

				return mappedValue.includes(filterValue.toLowerCase());
			});
		});
	}, [data, debouncedFilters]);

	const toggleRow = (id: number) => {
		setExpandedRows(prev => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	const onFilter = useCallback((value: string, key: keyof UserFilters) => {
		setFilters(prev => ({ ...prev, [key]: value }));
	}, []);

	const onToggleFilterList = useCallback((value: string, key: keyof UserFilters) => {
		setFilters(prev => {
			const currentList = prev[key];
			if (!Array.isArray(currentList)) return prev;

			const newList = currentList.includes(value)
				? currentList.filter(item => item !== value) // Remove if exists
				: [...currentList, value]; // Add if new

			return { ...prev, [key]: newList };
		});
	}, []);

	return (
		<div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
			{/* Header / Search Controls */}
			<header className="h-16 border-b bg-background flex items-center px-6 shrink-0">
				<h1 className="font-bold">Role Assignment</h1>
			</header>
			<div className="shrink-0 p-4 pb-0">
				<div className="flex flex-col gap-3 mb-4">
					<RoleComboBox
						selectedRoleId={currentRole}
						onRoleChange={setCurrentRole}
						className={"w-50"}
					/>
				</div>
			</div>

			{/* Scrollable Grid */}
			<ScrollArea
				className="flex-1 min-h-0 w-full"
				type="always"
			>
				<div className="px-4">
					{/* Table Header */}
					<div className="grid grid-cols-2 md:grid-cols-6 items-center border-b p-2 sticky top-0 bg-background z-10">
						<FilterHeader title="Name">
							<DebouncedInput
								placeholder="Search names..."
								onChange={value => onFilter(value, "name")}
								value={filters.name}
							/>
						</FilterHeader>

						<div className="hidden md:block">
							<FilterHeader title="Email">
								<DebouncedInput
									placeholder="Search emails..."
									value={filters.email}
									onChange={value => onFilter(value, "email")}
								/>
							</FilterHeader>
						</div>

						<div className="font-bold min-w-0 hidden md:block text-center">
							<FilterHeader title="Employee #">
								<DebouncedInput
									placeholder="Search numbers..."
									value={filters.employeeNumber}
									onChange={value => onFilter(value, "employeeNumber")}
								/>
							</FilterHeader>
						</div>
						<div className="font-bold min-w-0 hidden md:block text-center">
							<FilterHeader title="Department">
								<div className="flex flex-col gap-2">
									{departmentList?.map(dept => (
										<div
											key={dept}
											className="flex flex-row items-center gap-2 text-sm"
										>
											<Checkbox
												checked={filters.department.includes(dept)}
												onCheckedChange={value => onToggleFilterList(Boolean(value) && dept ? dept : "", "department")}
											/>
											{dept}
										</div>
									))}
								</div>
							</FilterHeader>
						</div>

						<div className="hidden md:block content-center">
							<FilterHeader title="Status">
								<div className="flex flex-col gap-2">
									{STATUS_OPTIONS.map(option => (
										<div
											key={option.label}
											className="flex flex-row items-center gap-2 text-sm"
										>
											<Checkbox
												checked={filters.status.includes(option.value)}
												onCheckedChange={() => onToggleFilterList(option.value, "status")}
											/>
											{option.label}
										</div>
									))}
								</div>
							</FilterHeader>
						</div>
						<div className="font-bold min-w-0 text-center">
							<FilterHeader
								title="Assigned"
								center
							>
								<div className="flex flex-col gap-2">
									{ASSIGNED_OPTIONS.map(option => (
										<div
											key={option.label}
											className="flex flex-row items-center gap-2 text-sm"
										>
											<Checkbox
												checked={filters.department.includes(option.value)}
												onCheckedChange={() => onToggleFilterList(option.value, "assigned")}
											/>
											{option.label}
										</div>
									))}
								</div>
							</FilterHeader>
						</div>
					</div>

					{/* Table Body */}
					<div className="grid grid-cols-2 md:grid-cols-6 items-center w-auto px-2">
						{filteredEmployee?.map(employee => {
							const isExpanded = !!expandedRows[employee.userId];

							return (
								<div
									key={employee.userId}
									className="contents"
								>
									{/* Name Column */}
									<div className="flex items-center gap-2 py-2">
										<button
											onClick={() => toggleRow(employee.userId)}
											className="md:hidden p-1 hover:bg-slate-100 rounded"
										>
											{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
										</button>
										<span className="font-medium truncate">{employee.name}</span>
									</div>

									{/* Desktop Columns */}
									<div className="hidden md:block text-sm truncate px-2">{employee.email}</div>
									<div className="hidden md:block text-sm truncate">{employee.employeeNumber}</div>
									<div className="hidden md:block text-sm truncate">{employee.department}</div>
									<div className="hidden md:block text-sm truncate">{employee.employeeActive ? "Enabled" : "Disabled"}</div>

									{/* Toggle Column */}
									<div className="flex justify-center py-2">
										<Switch
											defaultChecked={employee.roles.some(r => String(r.roleId) === currentRole)}
											checked={employee.roles.some(r => String(r.roleId) === currentRole)}
											onCheckedChange={next => onToggleAssigned(employee.userId, next)}
										/>
									</div>

									{/* Mobile Detail Panel */}
									{isExpanded && (
										<div className="col-span-2 md:hidden bg-slate-50 p-3 rounded-lg text-sm space-y-2 border border-slate-200 mb-2 mx-2">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Email:</span>
												<span>{employee.email}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">ID:</span>
												<span>{employee.employeeNumber}</span>
											</div>
										</div>
									)}

									{/* Row Divider */}
									<div className="col-span-2 md:col-span-6 border-b border-slate-100" />
								</div>
							);
						})}
					</div>
				</div>
				<ScrollBar orientation="vertical" />
			</ScrollArea>
		</div>
	);
}

const FilterHeader = ({ title, center, children }: { title: string; center?: boolean; children: React.ReactNode }) => (
	<div className={cn("flex items-center gap-1 font-bold min-w-0", center && " justify-center")}>
		<span className="truncate">{title}</span>
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
				>
					<Filter size={14} />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-60 p-3"
				align="start"
			>
				<div className="space-y-2">
					<h4 className="font-medium leading-none text-sm">Filter {title}</h4>
					{children}
				</div>
			</PopoverContent>
		</Popover>
	</div>
);

interface DebouncedInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
	value: string;
	onChange: (value: string) => void;
	debounce?: number;
}

const DebouncedInput = ({ value, onChange, debounce = 150, ...props }: DebouncedInputProps) => {
	const [localValue, setLocalValue] = useState(value);

	const onChangeRef = React.useRef(onChange);
	onChangeRef.current = onChange;

	// Sync local state if the prop changes (e.g. clearing filters)
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	useEffect(() => {
		if (localValue === value) return;

		const timeout = setTimeout(() => {
			onChangeRef.current(localValue);
		}, debounce);
		return () => clearTimeout(timeout);
	}, [localValue, value, debounce]);

	return (
		<Input
			{...props}
			value={localValue}
			onChange={e => setLocalValue(e.target.value)}
		/>
	);
};

function getDistinctValuesByKey<T, K extends keyof T>(list: T[], key: K): T[K][] {
	if (!list) return [];

	return [...new Set(list.map(item => item[key]))];
}

export function generateEmployees(count = 30) {
	const firstNames = [
		"Jordan",
		"Ava",
		"Liam",
		"Sophia",
		"Noah",
		"Emma",
		"Oliver",
		"Mia",
		"Elijah",
		"Charlotte",
		"James",
		"Amelia",
		"Benjamin",
		"Harper",
		"Lucas",
		"Evelyn",
		"Henry",
		"Isabella",
		"Alexander",
		"Luna",
		"William",
		"Ella",
		"Jack",
		"Scarlett",
		"Daniel",
		"Grace",
		"Matthew",
		"Chloe",
		"Samuel",
		"Victoria",
	];

	const lastNames = [
		"Kahtava",
		"Thompson",
		"Chen",
		"Patel",
		"Williams",
		"Johnson",
		"Brown",
		"Davis",
		"Wilson",
		"Garcia",
		"Martinez",
		"Rodriguez",
		"Lee",
		"Walker",
		"Hall",
		"Young",
		"King",
		"Wright",
		"Scott",
		"Green",
		"Adams",
		"Baker",
		"Nelson",
		"Carter",
		"Mitchell",
		"Perez",
		"Roberts",
		"Turner",
		"Phillips",
		"Campbell",
	];

	const employees = [];

	for (let i = 0; i < count; i++) {
		const first = firstNames[i % firstNames.length];
		const last = lastNames[i % lastNames.length];

		employees.push({
			id: i + 1,
			name: `${first} ${last}`,
			email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
			employeeNumber: 10000 + i,
		});
	}

	return employees;
}
