"use client";
import { useMemo, useState } from "react";
import {
  ArrowDownAz,
  ArrowUpAz,
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  FilterX,
  LoaderCircle,
  LucideShieldUser,
  X,
} from "lucide-react";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
} from "@tanstack/react-table";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

import { useUsersQuery } from "@/lib/services/users";
import { cn } from "@/lib/utils";

import React from "react";
import { GenericError } from "../../../components/shared/generic-error";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

import { getDistinctValuesByKey } from "@/lib/helpers";
import { IUser } from "@/lib/schemas";

const STATUS_OPTIONS = [
  { label: "Enabled", value: "true" },
  { label: "Disabled", value: "false" },
];

const DEFAULT_FILTERS = [{ id: "employeeActive", value: ["true"] }];

export function UserLayout() {
  const { data, isPending, isFetching, error } = useUsersQuery();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "employeeActive", value: ["true"] }, // Default filter
  ]);

  const [expanded, setExpanded] = useState({});

  const departmentList = useMemo(() => {
    if (!data) return [];

    return getDistinctValuesByKey(data, "department").filter((dept): dept is string => !!dept);
  }, [data]);

  const isDefaultState = useMemo(() => {
    if (columnFilters.length !== DEFAULT_FILTERS.length) return false;

    return columnFilters.every(
      (f) => f.id === "employeeActive" && Array.isArray(f.value) && f.value[0] === "true" && f.value.length === 1,
    );
  }, [columnFilters]);

  const columns = useMemo<ColumnDef<IUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <FilterHeader title="Name" column={column}>
            <DebouncedInput
              placeholder="Search names..."
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(value) => column.setFilterValue(value)}
            />
          </FilterHeader>
        ),
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2 py-2">
            <button onClick={row.getToggleExpandedHandler()} className="md:hidden p-1 hover:bg-slate-100 rounded">
              {row.getIsExpanded() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <span className="font-medium truncate">{getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <div className="hidden md:block">
            <FilterHeader title="Email" column={column}>
              <DebouncedInput
                placeholder="Search emails..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(value) => column.setFilterValue(value)}
              />
            </FilterHeader>
          </div>
        ),
        cell: ({ getValue }) => <div className="hidden md:block text-sm truncate px-2">{getValue() as string}</div>,
      },
      {
        accessorKey: "employeeNumber",
        header: ({ column }) => (
          <div className="hidden md:block">
            <FilterHeader title="Employee #" column={column}>
              <DebouncedInput
                placeholder="Search numbers..."
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(value) => column.setFilterValue(value)}
              />
            </FilterHeader>
          </div>
        ),
        cell: ({ getValue }) => <div className="hidden md:block text-sm truncate">{getValue() as string}</div>,
      },
      {
        accessorKey: "department",
        header: ({ column }) => (
          <div className="hidden md:block">
            <FilterHeader title="Department" column={column}>
              <CheckboxFilterGroup column={column} options={departmentList?.map((d) => ({ label: d, value: d }))} />
            </FilterHeader>
          </div>
        ),
        filterFn: (row, id, filterValue) => {
          if (!filterValue || filterValue.length === 0) return true;

          return filterValue.includes(String(row.getValue(id)));
        },
        cell: ({ getValue }) => <div className="hidden md:block text-sm truncate">{getValue() as string}</div>,
      },
      {
        accessorKey: "employeeActive",
        header: ({ column }) => {
          const currentFilters = (column.getFilterValue() as string[]) ?? [];

          return (
            <div className="hidden md:block">
              <FilterHeader title="Status" center column={column}>
                <CheckboxFilterGroup
                  column={column}
                  options={STATUS_OPTIONS?.map((d) => ({ label: d.label, value: d.value }))}
                />
              </FilterHeader>
            </div>
          );
        },
        filterFn: (row, id, filterValue) => {
          if (!filterValue.length) return true;

          const rowValue = String(row.getValue(id));
          return filterValue.includes(rowValue);
        },
        cell: ({ getValue }) => (
          <div className="hidden md:block text-sm truncate text-center">{getValue() ? "Enabled" : "Disabled"}</div>
        ),
      },
      {
        id: "actions",
        header: ({ table }) => {
          return (
            <div className="flex items-center justify-center min-w-0 font-bold">
              {!isDefaultState ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setColumnFilters(DEFAULT_FILTERS)}
                  className="h-7 text-destructive hover:bg-destructive/10 animate-in fade-in zoom-in duration-200"
                >
                  <FilterX className="h-4 w-4 mr-1" />
                  <span className="text-[10px] uppercase">Clear</span>
                </Button>
              ) : (
                <span className="text-sm animate-in fade-in zoom-in duration-200">Actions</span>
              )}
            </div>
          );
        },
        cell: () => (
          <div className="flex justify-center py-2">
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" /> View
            </Button>
          </div>
        ),
      },
    ],
    [departmentList, isDefaultState],
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, columnFilters, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => String(row.userId),
  });

  const isLoading = isFetching && !data;

  if (error) {
    return <GenericError error={error} />;
  }

  return (
    <div className="flex flex-col h-full w-full rounded-lg border">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between border-b">
        <div className="flex items-center gap-3 h-14 font-bold text-xl">Users</div>
        <div className="flex items-center gap-2">
          <Button>Add User</Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="px-4">
            {/* Header Row */}
            <div className="grid grid-cols-2 md:grid-cols-6 items-center border-b p-2 sticky top-0 bg-background z-10">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <div key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</div>
              ))}
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="mt-4 h-64 flex items-center justify-center">
                <LoaderCircle className="animate-spin text-muted-foreground" />
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <Empty className="mt-4 border-dashed">
                <EmptyHeader>
                  <EmptyMedia>
                    <LucideShieldUser />
                  </EmptyMedia>
                  <EmptyTitle>No Users Found</EmptyTitle>
                  <EmptyDescription>Adjust your filters and try again.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" onClick={() => table.resetColumnFilters()}>
                    Reset Filters
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <div className="grid grid-cols-2 md:grid-cols-6 items-center w-auto px-2 border-b">
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                    ))}
                  </div>
                  {/* Mobile Expanded View */}
                  {row.getIsExpanded() && (
                    <div className="col-span-2 md:hidden p-4 bg-muted/30 space-y-2 text-sm border-x border-b mx-2 rounded-b-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{row.original.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <span>{row.original.employeeNumber}</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
}
const FilterHeader = <TData, TValue>({
  title,
  column,
  center,
  children,
}: {
  title: string;
  column: Column<TData, TValue>;
  center?: boolean;
  children: React.ReactNode;
}) => {
  const isFiltered = column.getIsFiltered();
  const sortDir = column.getIsSorted();

  return (
    <div className={cn("flex items-center font-bold", center && "justify-center")}>
      <Button
        variant="link"
        size="sm"
        className="h-7 px-2 font-semibold gap-1"
        onClick={() => column.toggleSorting(sortDir === "asc")}
      >
        {title}
        {sortDir === "asc" && <ArrowDownAz className="h-4 w-4" />}
        {sortDir === "desc" && <ArrowUpAz className="h-4 w-4" />}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className={cn("h-7 w-7", isFiltered && "text-primary")}>
            {isFiltered ? <FilterX className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filter {title}</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => column.setFilterValue(undefined)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {children}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 300,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
} & Omit<React.ComponentProps<"input">, "onChange">) {
  const [value, setValue] = useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => onChange(value), debounce);
    return () => clearTimeout(timeout);
  }, [value, debounce, onChange]);

  return <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
}

// 1. Create a dedicated Filter component
const CheckboxFilterGroup = <TData, TValue>({
  column,
  options,
}: {
  column: Column<TData, TValue>;
  options: { label: string; value: string }[];
}) => {
  const currentFilters = (column.getFilterValue() as string[]) ?? [];

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <div key={opt.value} className="flex flex-row items-center gap-2 text-sm">
          <Checkbox
            checked={currentFilters.includes(opt.value)}
            onCheckedChange={(checked) => {
              const nextValue = checked
                ? [...currentFilters, opt.value]
                : currentFilters.filter((v) => v !== opt.value);
              column.setFilterValue(nextValue.length > 0 ? nextValue : undefined);
            }}
          />
          {opt.label}
        </div>
      ))}
    </div>
  );
};
