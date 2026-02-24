import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownAz,
  ArrowUpAz,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Dot,
  Filter,
  FilterX,
  ListFilter,
  ListFilterPlus,
  LoaderCircle,
  LucideShieldUser,
  Minus,
  X,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { GenericSelect } from "@/components/shared/GenericSelect";
import { ComboBox, ComboBoxTrigger } from "@/components/ui/combobox";
import { usePermissionUserQuery, usePermissionUserRoleMutationUpsert, useRolesQuery } from "@/lib/services/permissions";
import { GenericComboBox } from "@/components/shared/GenericComboBox";
import { RoleComboBox } from "../roles/role-combobox";
import { useUsersQuery } from "@/lib/services/users";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import React from "react";
import { GenericError } from "../../../components/shared/generic-error";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

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

const defaultFilters: UserFilters = {
  name: "",
  email: "",
  employeeNumber: "",
  department: [],
  status: ["true"],
  assigned: [],
};

export function UserRoleAssignmentList({ onToggleAssigned }: EmployeeTableSectionProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentRole, setCurrentRole] = useState<{ id: string; label: string } | undefined>(undefined);

  const [filters, setFilters] = useState<UserFilters>(defaultFilters);

  const putUserRole = usePermissionUserRoleMutationUpsert();

  const { data, isPending, isFetching, error } = usePermissionUserQuery(currentRole?.id, currentRole !== undefined);

  const departmentList = useMemo(() => {
    return data ? getDistinctValuesByKey(data, "department") : [];
  }, [data]);

  const debouncedFilters = useDebounce(filters, 500);

  const filteredEmployee = useMemo(() => {
    if (!data) return [];

    return data.filter((user) => {
      return Object.entries(debouncedFilters).every(([key, filterValue]) => {
        // 1. Skip if the filter is empty
        if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
          return true;
        }

        // 2. Extract value from the user object based on the key
        switch (key) {
          case "name":
          case "email":
          case "employeeNumber":
            const userVal = String(user[key as keyof typeof user] || "").toLowerCase();
            return userVal.includes(String(filterValue).toLowerCase());

          case "department":
            // Expects filterValue to be an array of strings
            return (filterValue as string[]).includes(user.department || "");

          case "status":
            // status: ["true"] or ["false"]
            return (filterValue as string[]).includes(String(user.employeeActive));

          case "assigned": {
            const isAssigned = user.roles.some((r) => String(r.roleId) === currentRole?.id);
            const filterArr = filterValue as string[];

            // Logic: If both true and false are selected (length 2), show everyone.
            // Otherwise, check if the calculated 'isAssigned' matches the selected toggle.
            if (filterArr.includes("true") && filterArr.includes("false")) return true;
            return filterArr.includes(String(isAssigned));
          }

          default:
            return true;
        }
      });
    });
  }, [currentRole?.id, data, debouncedFilters]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const onFilter = useCallback((value: string, key: keyof UserFilters) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onToggleFilterList = useCallback((value: string, key: keyof UserFilters) => {
    setFilters((prev) => {
      const currentList = prev[key];
      if (!Array.isArray(currentList)) return prev;

      const newList = currentList.includes(value)
        ? currentList.filter((item) => item !== value) // Remove if exists
        : [...currentList, value]; // Add if new

      return { ...prev, [key]: newList };
    });
  }, []);

  const isLoading = isFetching && !data;
  const noData = !currentRole || (!isLoading && filteredEmployee.length === 0);

  if (error) {
    return <GenericError error={error} />;
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      {/* Header / Search Controls */}

      <div className="shrink-0 p-4 pb-0">
        <div className="flex flex-col gap-3 mb-4">
          <RoleComboBox
            selectedRoleId={currentRole?.id}
            onRoleChange={(id, label) => setCurrentRole({ id, label })}
            className={"w-50"}
          />
        </div>
      </div>

      {/* Scrollable Grid */}
      <ScrollArea className="flex-1 min-h-0 w-full" type="always">
        <div className="px-4">
          {/* Table Header */}
          <div className="grid grid-cols-2 md:grid-cols-6 items-center border-b p-2 sticky top-0 bg-background z-10">
            <FilterHeader title="Name" isSortedAsc={true} isFiltered={filters.name.length > 0}>
              <DebouncedInput
                placeholder="Search names..."
                onChange={(value) => onFilter(value, "name")}
                value={filters.name}
              />
            </FilterHeader>

            <div className="hidden md:block">
              <FilterHeader title="Email" isFiltered={filters.email.length > 0}>
                <DebouncedInput
                  placeholder="Search emails..."
                  value={filters.email}
                  onChange={(value) => onFilter(value, "email")}
                />
              </FilterHeader>
            </div>

            <div className="font-bold min-w-0 hidden md:block text-center">
              <FilterHeader title="Employee #" isFiltered={filters.employeeNumber.length > 0}>
                <DebouncedInput
                  placeholder="Search numbers..."
                  value={filters.employeeNumber}
                  onChange={(value) => onFilter(value, "employeeNumber")}
                />
              </FilterHeader>
            </div>
            <div className="font-bold min-w-0 hidden md:block text-center">
              <FilterHeader
                title="Department"
                isFiltered={filters.department.length > 0}
                totalSelected={filters.department.length}
              >
                <div className="flex flex-col gap-2">
                  {departmentList?.map((dept) => {
                    if (!dept) return null;
                    return (
                      <div key={dept} className="flex flex-row items-center gap-2 text-sm">
                        <DebouncedCheckbox
                          checked={filters.department.includes(dept)}
                          onCheckedChange={(value) => onToggleFilterList(dept, "department")}
                        />
                        {dept}
                      </div>
                    );
                  })}
                </div>
              </FilterHeader>
            </div>

            <div className="hidden md:block content-center">
              <FilterHeader
                title="Status"
                center
                isFiltered={filters.status.length > 0}
                totalSelected={filters.status.length}
              >
                <div className="flex flex-col gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <div key={option.label} className="flex flex-row items-center gap-2 text-sm">
                      <DebouncedCheckbox
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
                isFiltered={filters.assigned.length > 0}
                totalSelected={filters.assigned.length}
              >
                <div className="flex flex-col gap-2">
                  {ASSIGNED_OPTIONS.map((option) => (
                    <div key={option.label} className="flex flex-row items-center gap-2 text-sm">
                      <DebouncedCheckbox
                        checked={filters.assigned.includes(option.value)}
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
          {noData && (
            <Empty className="border border-dashed mt-4">
              <EmptyHeader>
                <EmptyMedia>
                  <LucideShieldUser />
                </EmptyMedia>
                <EmptyTitle>No Users Found</EmptyTitle>
                <EmptyDescription>Please select a Role or adjust Filters</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={() => setFilters(defaultFilters)}>
                  Reset Filters to Default
                </Button>
              </EmptyContent>
            </Empty>
          )}
          {isLoading && (
            <div className="mt-4 h-65">
              <Skeleton className="p-4 h-full flex justify-center  items-center">
                <LoaderCircle className="animate-spin" />
              </Skeleton>
            </div>
          )}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-6 items-center w-auto px-2">
              {filteredEmployee?.map((employee) => {
                const isExpanded = !!expandedRows[employee.userId];

                return (
                  <div key={employee.userId} className="contents">
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
                    <div className="hidden md:block text-sm truncate text-center">
                      {employee.employeeActive ? "Enabled" : "Disabled"}
                    </div>

                    {/* Toggle Column */}
                    <div className="flex justify-center py-2">
                      <Switch
                        defaultChecked={employee.roles.some((r) => String(r.roleId) === currentRole?.id && r.granted)}
                        checked={employee.roles.some((r) => String(r.roleId) === currentRole?.id && r.granted)}
                        onCheckedChange={(next) => {
                          if (!currentRole) return;
                          putUserRole.mutate({
                            userId: String(employee.userId),
                            roleId: currentRole?.id,
                            assignRole: next,
                            roleName: currentRole?.label,
                          });
                        }}
                      />
                    </div>

                    {/* Mobile Detail Panel */}
                    {isExpanded && (
                      <div className="col-span-2 md:hidden  p-3 rounded-lg text-sm space-y-2 border  mb-2 mx-2">
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
                    <div className="col-span-2 md:col-span-6 border-b" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}

const FilterHeader = ({
  title,
  center,
  isFiltered,
  totalSelected,
  isSortedAsc,
  isSortedDesc,
  onClearFilter,
  onToggleSort,
  children,
}: {
  title: string;
  center?: boolean;
  isFiltered?: boolean;
  totalSelected?: number;
  isSortedAsc?: boolean;
  isSortedDesc?: boolean;
  onClearFilter?: () => void;
  onToggleSort?: () => void;
  children: React.ReactNode;
}) => {
  const sortIcon = isSortedAsc ? (
    <ArrowDownAz className="h-4 w-4 shrink-0" aria-hidden />
  ) : isSortedDesc ? (
    <ArrowUpAz className="h-4 w-4 shrink-0" aria-hidden />
  ) : null;
  //<Dot className="fill-background outline-background stroke-background" />
  const isCountVisible = Boolean(isFiltered && (totalSelected ?? 0) > 0);

  return (
    <div className="min-w-0 flex items-center font-bold">
      <div className={cn("min-w-0 inline-flex items-center ", center && "mx-auto")}>
        <Button
          variant="link"
          size={"sm"}
          className={cn(
            "min-w-0  h-7 px-2 text-sm font-semibold gap-1",
            center ? "justify-center text-center" : "justify-start text-left",
          )}
          title={isSortedAsc || isSortedDesc ? `Sort by ${title}` : title}
          onClick={onToggleSort}
        >
          <span className={cn("block truncate", center && "mx-auto text-center")}>{title}</span>
          {sortIcon && <span className="ml-0.5">{sortIcon}</span>}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"ghost"}
              size={"icon"}
              className={cn("h-7 w-7 shrink-0", isFiltered && "text-primary")}
              title={isFiltered ? `${totalSelected} filters applied` : `Filter by ${title}`}
              aria-pressed={isFiltered}
            >
              {isFiltered ? <FilterX /> : <Filter />}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-60 p-3" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium leading-none text-sm">Filter {title}</h4>
                <Button variant={"ghost"} size={"icon"} className="size-6" onClick={onClearFilter}>
                  <X />
                </Button>
              </div>
              {children}
            </div>
          </PopoverContent>
        </Popover>
        {isCountVisible && (
          <span
            className="hidden lg:inline-flex shrink-0 items-center rounded-full bg-muted px-1.5 py-0.5 text-sm leading-none text-muted-foreground ml-0.5"
            aria-label={`${totalSelected} selected`}
            title={`${totalSelected} selected`}
          >
            {totalSelected}
          </span>
        )}
      </div>
    </div>
  );
};

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

  return <Input {...props} value={localValue} onChange={(e) => setLocalValue(e.target.value)} />;
};

interface DebouncedCheckboxProps extends Omit<React.ComponentProps<typeof Checkbox>, "onCheckedChange"> {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  debounce?: number;
}

const DebouncedCheckbox = ({ checked, onCheckedChange, debounce = 150, ...props }: DebouncedCheckboxProps) => {
  const [localValue, setLocalValue] = useState(checked);

  const onChangeRef = React.useRef(onCheckedChange);
  onChangeRef.current = onCheckedChange;

  // Sync local state if the prop changes (e.g. clearing filters)
  useEffect(() => {
    setLocalValue(checked);
  }, [checked]);

  useEffect(() => {
    if (localValue === checked) return;

    const timeout = setTimeout(() => {
      onChangeRef.current(localValue);
    }, debounce);
    return () => clearTimeout(timeout);
  }, [localValue, checked, debounce]);

  return <Checkbox {...props} checked={localValue} onCheckedChange={() => onCheckedChange(!localValue)} />;

  //return <Input {...props} value={localValue} onChange={(e) => setLocalValue(e.target.value)} />;
};

function getDistinctValuesByKey<T, K extends keyof T>(list: T[], key: K): T[K][] {
  if (!list) return [];

  return [...new Set(list.map((item) => item[key]))];
}
