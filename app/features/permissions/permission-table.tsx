import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export interface Employee {
  id: number;
  name: string;
  email: string;
  employeeNumber: number;
}

interface EmployeeTableSectionProps {
  employees: Employee[];
  onToggleAssigned: (id: number, next: boolean) => void;
}

export function PermissionGroupList({ employees, onToggleAssigned }: EmployeeTableSectionProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      {/* Header / Search Controls */}
      <div className="shrink-0 p-4 pb-0">
        <div className="flex flex-col gap-3 mb-4">
          <Input placeholder="Select Role" className="w-full" />
          <Input placeholder="Search employees..." className="w-full" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", "Assigned", "Unassigned"].map((f) => (
              <Button key={f} size="sm" variant="outline" className="whitespace-nowrap">
                {f}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Grid */}
      <ScrollArea className="flex-1 min-h-0 w-full" type="always">
        <div className="px-4">
          {/* Table Header */}
          <div className="grid grid-cols-2 md:grid-cols-6 items-center border-b p-2 sticky top-0 bg-background z-10">
            <FilterHeader title="Name">
              <Input placeholder="Search names..." />
            </FilterHeader>

            <div className="hidden md:block">
              <FilterHeader title="Email">
                <div className="flex flex-col gap-2">
                  {["Engineering", "Sales", "HR"].map((dept) => (
                    <div key={dept} className="flex flex-row items-center gap-2 text-sm">
                      <Checkbox />
                      {dept}
                    </div>
                  ))}
                </div>
              </FilterHeader>
            </div>

            <div className="font-bold min-w-0 hidden md:block text-center">
              Employee #
              <Button variant={"ghost"} size={"icon"}>
                <Filter />
              </Button>
            </div>
            <div className="font-bold min-w-0 hidden md:block text-center">
              Dept
              <Button variant={"ghost"} size={"icon"}>
                <Filter />
              </Button>
            </div>
            <div className="font-bold min-w-0 hidden md:block text-center">
              Status
              <Button variant={"ghost"} size={"icon"}>
                <Filter />
              </Button>
            </div>
            <div className="font-bold min-w-0 text-center">
              Assigned
              <Button variant={"ghost"} size={"icon"}>
                <Filter />
              </Button>
            </div>
          </div>

          {/* Table Body */}
          <div className="grid grid-cols-2 md:grid-cols-6 items-center w-auto">
            {employees.map((employee) => {
              const isExpanded = !!expandedRows[employee.id];

              return (
                <div key={employee.id} className="contents">
                  {/* Name Column */}
                  <div className="flex items-center gap-2 py-2">
                    <button onClick={() => toggleRow(employee.id)} className="md:hidden p-1 hover:bg-slate-100 rounded">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <span className="font-medium truncate">{employee.name}</span>
                  </div>

                  {/* Desktop Columns */}
                  <div className="hidden md:block text-center text-sm truncate px-2">{employee.email}</div>
                  <div className="hidden md:block text-center text-sm truncate">{employee.employeeNumber}</div>
                  <div className="hidden md:block text-center text-sm truncate">Engineering</div>
                  <div className="hidden md:block text-center text-sm truncate">Active</div>

                  {/* Toggle Column */}
                  <div className="flex justify-center py-2">
                    <Switch
                      checked={false} // Connect to your actual state logic
                      onCheckedChange={(next) => onToggleAssigned(employee.id, next)}
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

const FilterHeader = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-1 font-bold min-w-0">
    <span className="truncate">{title}</span>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Filter size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <div className="space-y-2">
          <h4 className="font-medium leading-none text-sm">Filter {title}</h4>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  </div>
);

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
