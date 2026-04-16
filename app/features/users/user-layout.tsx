'use client';
import { useMemo, useState } from 'react';
import { ArrowDownAz, ArrowUpAz, ChevronDown, ChevronUp, Eye, Filter, FilterX, LoaderCircle, LucideShieldUser, X } from 'lucide-react';

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
  createColumnHelper,
} from '@tanstack/react-table';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

import { useUsersQuery } from '@/lib/services/users';
import { cn } from '@/lib/utils';

import React from 'react';
import { GenericError } from '../../../components/shared/generic-error';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

import { getDistinctValuesByKey } from '@/lib/helpers';
import { IUser } from '@/lib/schemas';
import { useSharedUserDrawer } from '../user-drawer/drawer-context';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Disabled', value: 'false' },
];

const USER_TYPE_OPTIONS = [
  { label: 'Internal', value: 'true' },
  { label: 'External', value: 'false' },
];

const EMAIL_OPTIONS = [
  { label: 'Allowed', value: 'true' },
  { label: 'Blocked', value: 'false' },
];

const DEFAULT_FILTERS = [{ id: 'isActive', value: ['true'] }];

const MOBILE_COL_SPAN = 2;

export function UserLayout() {
  const { data, isPending, isFetching, error } = useUsersQuery(false);
  const { openUserDrawer } = useSharedUserDrawer();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: 'isActive', value: ['true'] }, // Default filter
  ]);

  const [expanded, setExpanded] = useState({});

  const departmentList = useMemo(() => {
    if (!data) return [];

    return getDistinctValuesByKey(data, 'department').filter((dept): dept is string => !!dept);
  }, [data]);

  const isDefaultState = useMemo(() => {
    if (columnFilters.length !== DEFAULT_FILTERS.length) return false;

    return columnFilters.every((f) => f.id === 'isActive' && Array.isArray(f.value) && f.value[0] === 'true' && f.value.length === 1);
  }, [columnFilters]);

  const prevIsDefault = React.useRef(isDefaultState);

  React.useEffect(() => {
    prevIsDefault.current = isDefaultState;
  }, [isDefaultState]);

  const columnHelper = createColumnHelper<IUser>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        size: 250,
        minSize: 250,
        maxSize: 250,

        header: ({ column }) => (
          <FilterHeader title="Name" column={column}>
            <DebouncedInput
              placeholder="Search names..."
              value={(column.getFilterValue() as string) ?? ''}
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
      }),
      columnHelper.accessor('department', {
        size: 200,
        header: ({ column }) => (
          <div className="hidden md:block ">
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
      }),
      columnHelper.accessor('email', {
        size: 250,
        header: ({ column }) => (
          <div className="hidden md:block ">
            <FilterHeader title="Email" column={column}>
              <DebouncedInput
                placeholder="Search email..."
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(value) => column.setFilterValue(value)}
              />
            </FilterHeader>
          </div>
        ),
        filterFn: (row, id, filterValue) => {
          if (!filterValue || filterValue.length === 0) return true;

          return filterValue.includes(String(row.getValue(id)));
        },
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2 py-2">
            <button onClick={row.getToggleExpandedHandler()} className="md:hidden p-1 hover:bg-slate-100 rounded">
              {row.getIsExpanded() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <span className="text-sm truncate">{getValue() as string}</span>
          </div>
        ),
      }),
      columnHelper.accessor('externalId', {
        size: 120,
        header: ({ column }) => (
          <div className="hidden md:block justify-items-center">
            <FilterHeader title="Employee #" column={column}>
              <DebouncedInput
                placeholder="Search numbers..."
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(value) => column.setFilterValue(value)}
              />
            </FilterHeader>
          </div>
        ),
        cell: ({ getValue }) => <div className="hidden md:block text-center text-sm truncate">{getValue() as string}</div>,
      }),

      columnHelper.accessor('isActive', {
        size: 120,
        header: ({ column }) => {
          const currentFilters = (column.getFilterValue() as string[]) ?? [];

          return (
            <div className="hidden md:block">
              <FilterHeader title="Status" center column={column}>
                <CheckboxFilterGroup column={column} options={STATUS_OPTIONS?.map((d) => ({ label: d.label, value: d.value }))} />
              </FilterHeader>
            </div>
          );
        },

        filterFn: (row, id, filterValue) => {
          if (!filterValue.length) return true;

          const rowValue = String(row.getValue(id));
          return filterValue.includes(rowValue);
        },
        cell: ({ getValue }) => {
          const value = getValue();
          const option = STATUS_OPTIONS.find((opt) => opt.value === String(value));
          return <div className="hidden md:block text-sm truncate text-center">{option ? option.label : String(value)}</div>;
        },
      }),

      columnHelper.accessor('isManaged', {
        size: 120,
        header: ({ column }) => {
          const currentFilters = (column.getFilterValue() as string[]) ?? [];

          return (
            <div className="hidden md:block">
              <FilterHeader title="Type" center column={column}>
                <CheckboxFilterGroup column={column} options={USER_TYPE_OPTIONS?.map((d) => ({ label: d.label, value: d.value }))} />
              </FilterHeader>
            </div>
          );
        },
        filterFn: (row, id, filterValue) => {
          if (!filterValue.length) return true;

          const rowValue = String(row.getValue(id));
          return filterValue.includes(rowValue);
        },

        cell: ({ getValue }) => {
          const value = getValue();
          const option = USER_TYPE_OPTIONS.find((opt) => opt.value === String(value));
          return <div className="hidden md:block text-sm truncate text-center">{option ? option.label : String(value)}</div>;
        },
      }),

      columnHelper.accessor('emailEnabled', {
        size: 120,
        header: ({ column }) => {
          const currentFilters = (column.getFilterValue() as string[]) ?? [];

          return (
            <div className="hidden md:block">
              <FilterHeader title="Email" center column={column}>
                <CheckboxFilterGroup column={column} options={EMAIL_OPTIONS?.map((d) => ({ label: d.label, value: d.value }))} />
              </FilterHeader>
            </div>
          );
        },
        filterFn: (row, id, filterValue) => {
          if (!filterValue.length) return true;

          const rowValue = String(row.getValue(id));
          return filterValue.includes(rowValue);
        },

        cell: ({ getValue }) => {
          const value = getValue();
          const option = EMAIL_OPTIONS.find((opt) => opt.value === String(value));
          return <div className="hidden md:block text-sm truncate text-center">{option ? option.label : String(value)}</div>;
        },
      }),

      columnHelper.display({
        id: 'action',

        size: 100,
        minSize: 100,
        maxSize: 100,
        enableResizing: false,

        header: () => {
          const hasChanged = prevIsDefault.current !== isDefaultState;

          const animationClasses = hasChanged ? 'animate-in fade-in zoom-in duration-200' : '';
          return (
            <div className="flex items-center justify-center min-w-0 font-bold">
              {!isDefaultState ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setColumnFilters(DEFAULT_FILTERS)}
                  className={cn(
                    'h-7 text-destructive hover:bg-destructive/10',
                    animationClasses, // Only applied when flipping into this state
                  )}
                >
                  <FilterX className="h-4 w-4 mr-1" />
                  <span className="text-[10px] uppercase">Clear</span>
                </Button>
              ) : (
                <span className={cn('text-sm', animationClasses)}>Actions</span>
              )}
            </div>
          );
        },

        cell: ({ row }) => (
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                openUserDrawer({ user: row.original });
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
          </div>
        ),
      }),
    ],
    [columnHelper, departmentList, isDefaultState, openUserDrawer],
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
  const columnCount = useMemo(() => table.getVisibleFlatColumns().length, [table]);

  if (error) {
    return <GenericError error={error} />;
  }

  return (
    <div className="flex flex-col h-full w-full rounded-lg border pr-4" style={{ '--col-count': columnCount } as React.CSSProperties}>
      <div className=" gap-4 p-4  flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3 h-14 font-bold text-xl">Users</div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              openUserDrawer({});
            }}
          >
            Add User
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full pr-4">
          <table className="table-fixed w-full border-seperate border-spacing-0 ">
            <thead className="sticky top-0 bg-background z-30 border-b shadow-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index, headerCells) => {
                    const isName = header.column.id === 'name';
                    const isAction = header.column.id === 'action';
                    const isLastScrollingCell = index === headerCells.length - 2;
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.column.getSize() }}
                        className={cn(
                          'px-4 py-2 text-left font-medium bg-background',
                          isName && 'sticky left-0 z-40 shadow-sticky-x',
                          isAction && 'sticky right-0 z-40 text-center  shadow-sticky-x',
                          !isName && !isAction && ['hidden md:table-cell', !isLastScrollingCell && 'border-r'],
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length}>
                    <div className="h-64 flex items-center justify-center">
                      <LoaderCircle className="animate-spin text-muted-foreground" />
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length}>
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
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="border-b hover:bg-muted group">
                      {row.getVisibleCells().map((cell, index, allCells) => {
                        const isName = cell.column.id === 'name';
                        const isAction = cell.column.id === 'action';
                        const isLastScrollingCell = index === allCells.length - 2;

                        return (
                          <td
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                            className={cn(
                              'px-4 py-2 align-middle truncate group-hover:bg-muted',
                              isName && 'sticky left-0 z-20  bg-background shadow-sticky-x',
                              isAction && 'sticky right-0 z-20  bg-background text-center shadow-sticky-x',
                              !isName && !isAction && ['hidden md:table-cell', !isLastScrollingCell && 'border-r'],
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>

                    {row.getIsExpanded() && (
                      <tr className="md:hidden bg-muted/30">
                        <td colSpan={MOBILE_COL_SPAN}>
                          <div className="p-4 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-y-2">
                              <span className="text-muted-foreground font-medium">Department:</span>
                              <span className="truncate">{row.original.department}</span>

                              <span className="text-muted-foreground font-medium">Email:</span>
                              <span className="truncate">{row.original.email}</span>

                              <span className="text-muted-foreground font-medium">Employee #:</span>
                              <span>{row.original.externalId}</span>

                              <span className="text-muted-foreground font-medium">Status:</span>
                              <span>{STATUS_OPTIONS.find((option) => option.value === String(row.original.isActive))?.label}</span>

                              <span className="text-muted-foreground font-medium">User Type:</span>
                              <span>{USER_TYPE_OPTIONS.find((option) => option.value === String(row.original.isManaged))?.label}</span>

                              <span className="text-muted-foreground font-medium">Send Notifications</span>
                              <span>{EMAIL_OPTIONS.find((option) => option.value === String(row.original.emailEnabled))?.label}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>

          <ScrollBar className="z-50" orientation="vertical" />
          <ScrollBar className="z-50" orientation="horizontal" />
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
    <div className={cn('flex items-center font-bold', center && 'justify-center')}>
      <Button variant="link" size="sm" className="h-7 px-2 font-semibold gap-1" onClick={() => column.toggleSorting(sortDir === 'asc')}>
        {title}
        {sortDir === 'asc' && <ArrowDownAz className="h-4 w-4" />}
        {sortDir === 'desc' && <ArrowUpAz className="h-4 w-4" />}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className={cn('h-7 w-7', isFiltered && 'text-primary')}>
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
  value,
  onChange,
  debounce = 300,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
} & Omit<React.ComponentProps<'input'>, 'onChange'>) {
  const [localValue, setLocalValue] = useState(value);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (localValue === value) return;

    const timeout = setTimeout(() => {
      onChangeRef.current(localValue);
    }, debounce);
    return () => clearTimeout(timeout);
  }, [localValue, value, debounce]);

  return <Input {...props} value={localValue} onChange={(e) => setLocalValue(e.target.value)} />;
}

// 1. Create a dedicated Filter component
const CheckboxFilterGroup = <TData, TValue>({ column, options }: { column: Column<TData, TValue>; options: { label: string; value: string }[] }) => {
  const currentFilters = (column.getFilterValue() as string[]) ?? [];

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <div key={opt.value} className="flex flex-row items-center gap-2 text-sm">
          <Checkbox
            checked={currentFilters.includes(opt.value)}
            onCheckedChange={(checked) => {
              const nextValue = checked ? [...currentFilters, opt.value] : currentFilters.filter((v) => v !== opt.value);
              column.setFilterValue(nextValue.length > 0 ? nextValue : undefined);
            }}
          />
          {opt.label}
        </div>
      ))}
    </div>
  );
};
