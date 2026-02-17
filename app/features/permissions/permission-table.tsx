import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

function EmployeeRow({ employee, assigned, onToggle }) {
	return (
		<div
			className="
        grid grid-cols-4 items-center py-3 border-b
        md:table-row
      "
		>
			{/* Name */}
			<div className="font-medium md:table-cell">{employee.name}</div>

			{/* Email */}
			<div className="text-sm text-muted-foreground md:table-cell">{employee.email}</div>

			{/* Employee # */}
			<div className="text-center text-sm md:table-cell">{employee.employeeNumber}</div>

			{/* Toggle */}
			<div className="flex justify-end md:table-cell md:text-center">
				<Switch
					checked={assigned}
					onCheckedChange={next => onToggle(employee.id, next)}
				/>
			</div>
		</div>
	);
}

function EmployeeFilters({ filter, setFilter, search, setSearch }) {
	return (
		<div className="flex flex-col gap-3 mb-4">
			{/* Search */}
			<Input
				placeholder="Search employees..."
				value={search}
				onChange={e => setSearch(e.target.value)}
				className="w-full"
			/>

			{/* Filter chips */}
			<div className="flex gap-2 overflow-x-auto pb-1">
				{["All", "Assigned", "Unassigned"].map(f => (
					<Button
						key={f}
						variant={filter === f ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter(f)}
						className="whitespace-nowrap"
					>
						{f}
					</Button>
				))}
			</div>
		</div>
	);
}

export function EmployeeAssignmentTable({ employees, assignedIds, onToggle, filter, setFilter, search, setSearch }) {
	const filtered = employees
		.filter(e => (filter === "Assigned" ? assignedIds.includes(e.id) : filter === "Unassigned" ? !assignedIds.includes(e.id) : true))
		.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()));

	return (
		<div className="w-full">
			<EmployeeFilters
				filter={filter}
				setFilter={setFilter}
				search={search}
				setSearch={setSearch}
			/>

			{/* Desktop table header */}
			<div className="hidden md:table w-full mb-2">
				<div className="table-header-group">
					<div className="table-row">
						<div className="table-cell font-bold">Name</div>
						<div className="table-cell font-bold">Email</div>
						<div className="table-cell font-bold text-center">Employee #</div>
						<div className="table-cell font-bold text-center">Assigned</div>
					</div>
				</div>
			</div>

			{/* Rows */}
			<div className="md:table w-full">
				{filtered.map(employee => (
					<EmployeeRow
						key={employee.id}
						employee={employee}
						assigned={assignedIds.includes(employee.id)}
						onToggle={onToggle}
					/>
				))}
			</div>
		</div>
	);
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
