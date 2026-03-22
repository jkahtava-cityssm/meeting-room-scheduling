"use client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	ArrowDownAz,
	ArrowUpAz,
	ChevronDown,
	ChevronUp,
	Filter,
	FilterX,
	LoaderCircle,
	LoaderIcon,
	LucideDoorOpen,
	LucideShieldUser,
	Pencil,
	Terminal,
	X,
} from "lucide-react";

import { useEventPatchMutation } from "@/lib/services/events";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoomsQuery } from "@/lib/services/rooms";
import RoomCard from "./room-card";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { id } from "date-fns/locale";
import { type } from "os";
import EventCard from "../bookings/components/event-card";
import { IRoomSection } from "../bookings/components/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { BadgeColored } from "@/components/ui/badge-colored";
import { TColors } from "@/lib/types";
import DynamicIcon, { IconName } from "@/components/ui/icon-dynamic";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SharedRoomDrawerProvider, useSharedRoomDrawer } from "../room-drawer/shared-room-drawer-context";
import { getDistinctValuesByKey } from "@/lib/helpers";
import { useDebounce } from "@/hooks/use-debounce";
import { IRoom } from "@/lib/schemas";
import { GenericError } from "@/components/shared/generic-error";

interface RoomFilters {
	name: string;
	roomCategory: string[];
	color: string[];
	icon: string[];
	publicFacing: string[];
	properties: string[];
}

const defaultFilters: RoomFilters = {
	name: "",
	roomCategory: [],
	color: [],
	icon: [],
	publicFacing: [],
	properties: [],
};

type SortColumn = "icon" | "publicFacing" | "color" | "roomCategory" | "name";

type SortDirection = "desc" | "asc" | null;

export default function RoomLayout() {
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

	const [filters, setFilters] = useState<RoomFilters>(defaultFilters);

	const { data, isFetching, error } = useRoomsQuery();

	const { openRoomDrawer } = useSharedRoomDrawer();

	const [sort, setSort] = useState<{ key: SortColumn | null; dir: SortDirection }>({
		key: null,
		dir: null,
	});

	const toggleSort = useCallback((key: SortColumn) => {
		setSort(prev => {
			if (prev.key !== key) return { key, dir: "desc" };
			if (prev.dir === "desc") return { key, dir: "asc" };

			return { key: null, dir: null };
		});
	}, []);

	const isSortedAsc = useCallback((key: SortColumn) => sort.key === key && sort.dir === "asc", [sort]);
	const isSortedDesc = useCallback((key: SortColumn) => sort.key === key && sort.dir === "desc", [sort]);

	const colorList = useMemo(() => getDistinctValuesByKey(data ?? [], "color"), [data]);

	const iconList = useMemo(() => getDistinctValuesByKey(data ?? [], "icon"), [data]);

	const propertyList = useMemo(() => {
		const allProperties = data?.flatMap(r => r.roomProperty ?? []) ?? [];
		return getDistinctValuesByKey(allProperties, "name");
	}, [data]);

	const categoryList = useMemo(() => {
		const allCategories = data?.map(r => r.roomCategory).filter(Boolean) ?? [];
		return getDistinctValuesByKey(allCategories, "name");
	}, [data]);

	const { debouncedValue: debouncedFilters } = useDebounce(filters, 500);

	const filteredEmployee = useMemo(() => {
		if (!data) return [];

		return data.filter(room => {
			return Object.entries(debouncedFilters).every(([key, filterValue]) => {
				// 1. Skip if the filter is empty
				if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
					return true;
				}

				// 2. Extract value from the user object based on the key
				switch (key) {
					case "name":
						const roomValue = String(room[key as keyof typeof room] || "").toLowerCase();
						return roomValue.includes(String(filterValue).toLowerCase());

					case "roomCategory":
						return (filterValue as string[]).includes(room.roomCategory.name || "");
					case "icon":
						return (filterValue as string[]).includes(room.icon || "");
					case "color":
						return (filterValue as string[]).includes(room.color || "");
					case "properties":
						if (!room.roomProperty) return false;
						return room.roomProperty.some(property => {
							return (filterValue as string[]).some(filter => filter === property.name && property.value === "true" && property.type === "boolean");
						});

					case "publicFacing":
						return (filterValue as string[]).includes(String(room.publicFacing));

					default:
						return true;
				}
			});
		});
	}, [data, debouncedFilters]);

	// Helper: value extraction for the active sort key
	const getSortValue = useCallback((room: IRoom, key: SortColumn) => {
		switch (key) {
			case "name":
				return (room.name ?? "") as string;
			case "color":
				return (room.color ?? "") as string;
			case "icon":
				return (room.icon ?? "") as string;
			case "publicFacing":
				return room.publicFacing ? 1 : 0;

			case "roomCategory":
				return (room.roomCategory.name ?? "") as string;
		}
	}, []);

	const sortedRooms = useMemo(() => {
		if (!filteredEmployee) return [];
		if (!sort.key || !sort.dir) return filteredEmployee;

		const key = sort.key;
		const dir = sort.dir;

		const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

		const cmp = (roomA: IRoom, roomB: IRoom) => {
			const va = getSortValue(roomA, key);
			const vb = getSortValue(roomB, key);

			if (typeof va === "string" && typeof vb === "string") {
				return collator.compare(va, vb);
			}
			// number/boolean compare
			return va === vb ? 0 : va > vb ? 1 : -1;
		};

		const factor = dir === "asc" ? 1 : -1;

		// slice() to avoid mutating original; modern JS sort is stable.
		return filteredEmployee.slice().sort((a, b) => factor * cmp(a, b));
	}, [filteredEmployee, sort, getSortValue]);

	const toggleRow = (id: number) => {
		setExpandedRows(prev => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	const onFilter = useCallback((value: string, key: keyof IRoom) => {
		setFilters(prev => ({ ...prev, [key]: value }));
	}, []);

	const onToggleFilterList = useCallback((value: string, key: keyof RoomFilters) => {
		setFilters(prev => {
			const currentList = prev[key];
			if (!Array.isArray(currentList)) return prev;

			const newList = currentList.includes(value)
				? currentList.filter(item => item !== value) // Remove if exists
				: [...currentList, value]; // Add if new

			return { ...prev, [key]: newList };
		});
	}, []);

	const clearFilter = useCallback(<K extends keyof RoomFilters>(key: K) => {
		setFilters(prev => ({ ...prev, [key]: defaultFilters[key] }));
	}, []);

	const hasFilters = useMemo(() => JSON.stringify(filters) !== JSON.stringify(defaultFilters), [filters]);

	const isLoading = isFetching && !data;
	const noData = !isLoading && sortedRooms.length === 0;

	if (error) {
		return <GenericError error={error} />;
	}

	if (isLoading) {
		return (
			<div className="flex flex-col h-full w-full">
				<Skeleton className="w-full h-full" />
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full w-full rounded-lg border">
			<div className="flex flex-col gap-4  p-4 min-w-90 lg:flex-row lg:items-center lg:justify-between shrink-0 border-b">
				<div className="flex items-center gap-3 h-14 font-bold">Available Rooms</div>

				<div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
					<Button onClick={() => openRoomDrawer({})}>Add Room</Button>
				</div>
			</div>
			<div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
				<ScrollArea
					className="flex-1 min-h-0 w-full"
					type="always"
				>
					<div className="px-4">
						{/* Table Header */}
						<div className="grid grid-cols-2 md:grid-cols-7 items-center border-b p-2 sticky top-0 bg-background z-10">
							<FilterHeader
								title="Room Name"
								isSortedAsc={isSortedAsc("name")}
								isSortedDesc={isSortedDesc("name")}
								onToggleSort={() => toggleSort("name")}
								onClearFilter={() => clearFilter("name")}
								isFiltered={filters.name.length > 0}
							>
								<DebouncedInput
									placeholder="Search room name..."
									onChange={value => onFilter(value, "name")}
									value={filters.name}
								/>
							</FilterHeader>

							<div className="hidden md:block">
								<FilterHeader
									title="Category"
									isSortedAsc={isSortedAsc("roomCategory")}
									isSortedDesc={isSortedDesc("roomCategory")}
									onToggleSort={() => toggleSort("roomCategory")}
									onClearFilter={() => clearFilter("roomCategory")}
									isFiltered={filters.roomCategory.length > 0}
									totalSelected={filters.roomCategory.length}
								>
									<div className="flex flex-col gap-2">
										{categoryList.map(option => (
											<div
												key={option}
												className="flex flex-row items-center gap-2 text-sm"
											>
												<DebouncedCheckbox
													checked={filters.roomCategory.includes(option)}
													onCheckedChange={value => onToggleFilterList(option, "roomCategory")}
												/>
												{option}
											</div>
										))}
									</div>
								</FilterHeader>
							</div>

							<div className="font-bold min-w-0 hidden md:block text-center">
								<FilterHeader
									title="Colour"
									isSortedAsc={isSortedAsc("color")}
									isSortedDesc={isSortedDesc("color")}
									onToggleSort={() => toggleSort("color")}
									onClearFilter={() => clearFilter("color")}
									isFiltered={filters.color.length > 0}
									totalSelected={filters.color.length}
								>
									<div className="flex flex-col gap-2">
										{colorList.map(option => (
											<div
												key={option}
												className="flex flex-row items-center gap-2 text-sm"
											>
												<DebouncedCheckbox
													checked={filters.color.includes(option)}
													onCheckedChange={value => onToggleFilterList(option, "color")}
												/>
												{option}
											</div>
										))}
									</div>
								</FilterHeader>
							</div>
							<div className="font-bold min-w-0 hidden md:block text-center">
								<FilterHeader
									title="Icon"
									isSortedAsc={isSortedAsc("icon")}
									isSortedDesc={isSortedDesc("icon")}
									onToggleSort={() => toggleSort("icon")}
									onClearFilter={() => clearFilter("icon")}
									isFiltered={filters.icon.length > 0}
									totalSelected={filters.icon.length}
								>
									<div className="flex flex-col gap-2">
										{iconList?.map(icon => {
											if (!icon) return null;
											return (
												<div
													key={icon}
													className="flex flex-row items-center gap-2 text-sm"
												>
													<DebouncedCheckbox
														checked={filters.icon.includes(icon)}
														onCheckedChange={value => onToggleFilterList(icon, "icon")}
													/>
													{icon}
												</div>
											);
										})}
									</div>
								</FilterHeader>
							</div>

							<div className="hidden md:block content-center">
								<FilterHeader
									title="Public Facing"
									center
									isSortedAsc={isSortedAsc("publicFacing")}
									isSortedDesc={isSortedDesc("publicFacing")}
									onToggleSort={() => toggleSort("publicFacing")}
									onClearFilter={() => clearFilter("publicFacing")}
									isFiltered={filters.publicFacing.length > 0}
									totalSelected={filters.publicFacing.length}
								>
									<div className="flex flex-col gap-2">
										{[
											{ value: "false", label: "No" },
											{ value: "true", label: "Yes" },
										].map(option => (
											<div
												key={option.label}
												className="flex flex-row items-center gap-2 text-sm"
											>
												<DebouncedCheckbox
													checked={filters.publicFacing.includes(option.value)}
													onCheckedChange={value => onToggleFilterList(option.value, "publicFacing")}
												/>
												{option.label}
											</div>
										))}
									</div>
								</FilterHeader>
							</div>
							<div className="font-bold min-w-0 text-center">
								<FilterHeader
									title="Properties"
									center
									isSortedAsc={undefined}
									isSortedDesc={undefined}
									onToggleSort={undefined}
									onClearFilter={() => clearFilter("properties")}
									isFiltered={filters.properties.length > 0}
									totalSelected={filters.properties.length}
								>
									<div className="flex flex-col gap-2">
										{propertyList.map(option => (
											<div
												key={option}
												className="flex flex-row items-center gap-2 text-sm"
											>
												<DebouncedCheckbox
													checked={filters.properties.includes(option)}
													onCheckedChange={value => onToggleFilterList(option, "properties")}
												/>
												{option}
											</div>
										))}
									</div>
								</FilterHeader>
							</div>
							<div className="font-bold min-w-0 text-center">
								<div className="min-w-0 flex items-center font-bold">
									<div className={cn("min-w-0 inline-flex items-center mx-auto")}>
										{hasFilters ? (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setFilters(defaultFilters)}
												className="h-7 text-destructive hover:bg-destructive/10 animate-in fade-in zoom-in duration-200"
											>
												<FilterX className="h-4 w-4 mr-1" />
												<span className="text-[10px] uppercase">Clear</span>
											</Button>
										) : (
											<span className="text-sm  animate-in fade-in zoom-in duration-200">Actions</span>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Table Body */}
						{noData && (
							<Empty className="border border-dashed mt-4">
								<EmptyHeader>
									<EmptyMedia>
										<LucideDoorOpen />
									</EmptyMedia>
									<EmptyTitle>No Rooms Found</EmptyTitle>
									<EmptyDescription>Please add a room or adjust Filters</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setFilters(defaultFilters)}
									>
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
							<div className="grid grid-cols-2 md:grid-cols-7 items-center w-auto px-2">
								{sortedRooms?.map(room => {
									const isExpanded = false; //!!expandedRows[employee.userId];

									return (
										<div
											key={room.roomId}
											className="contents"
										>
											{/* Name Column */}
											<div className="flex items-center gap-2 py-2">
												<button
													onClick={() => {}}
													className="md:hidden p-1 hover:bg-slate-100 rounded"
												>
													{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
												</button>
												<span className="font-medium truncate">{room.name}</span>
											</div>

											{/* Desktop Columns */}
											<div className="hidden md:block text-sm truncate px-2">{room.roomCategory.name}</div>
											<div className="hidden md:block text-sm truncate">
												<BadgeColored color={room.color as TColors}>{room.color}</BadgeColored>
											</div>
											<div className="hidden md:block text-sm truncate">
												<div className="flex items-center gap-2">
													<DynamicIcon
														color={room.color as TColors}
														name={room.icon as IconName}
													/>

													{room.icon}
												</div>
											</div>
											<div className="hidden md:block text-sm truncate text-center">{room.publicFacing ? "Yes" : "No"}</div>

											{/* Toggle Column */}
											<div className="flex justify-center py-2">
												{room.roomProperty?.map(property => {
													if (property.value.toLocaleLowerCase() === "false") return null;
													return <Badge key={property.roomPropertyId}>{property.name}</Badge>;
												})}
											</div>
											<div className="flex justify-center py-2">
												<div className="flex items-center gap-2">
													<Button
														variant={"outline"}
														onClick={() => openRoomDrawer({ room: room })}
													>
														<Pencil />
														View
													</Button>
												</div>
											</div>

											{/* Mobile Detail Panel */}
											{isExpanded && (
												<div className="col-span-2 md:hidden  p-3 rounded-lg text-sm space-y-2 border  mb-2 mx-2">
													<div className="flex justify-between">
														<span className="text-muted-foreground">Email:</span>
														<span>{room.color}</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">ID:</span>
														<span>{room.icon}</span>
													</div>
												</div>
											)}

											{/* Row Divider */}
											<div className="col-span-2 md:col-span-7 border-b" />
										</div>
									);
								})}
							</div>
						)}
					</div>
					<ScrollBar orientation="vertical" />
				</ScrollArea>
			</div>
		</div>
	);
}

function NoContentWarning() {
	return (
		<div className="relative flex-1  p-4">
			<Alert className="mt-4 ">
				<Terminal className="h-4 w-4" />
				<AlertTitle>No Requests Found</AlertTitle>
				<AlertDescription>Please pick a different day, room, or status</AlertDescription>
			</Alert>
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
		<ArrowDownAz
			className="h-4 w-4 shrink-0"
			aria-hidden
		/>
	) : isSortedDesc ? (
		<ArrowUpAz
			className="h-4 w-4 shrink-0"
			aria-hidden
		/>
	) : null;
	//<Dot className="fill-background outline-background stroke-background" />
	const isCountVisible = Boolean(isFiltered && (totalSelected ?? 0) > 0);

	return (
		<div className="min-w-0 flex items-center font-bold">
			<div className={cn("min-w-0 inline-flex items-center ", center && "mx-auto")}>
				<Button
					variant="link"
					size={"sm"}
					className={cn("min-w-0  h-7 px-2 text-sm font-semibold gap-1", center ? "justify-center text-center" : "justify-start text-left")}
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

					<PopoverContent
						className="w-60 p-3"
						align="start"
					>
						<div className="space-y-2">
							<div className="flex items-center justify-between mb-2">
								<h4 className="font-medium leading-none text-sm">Filter {title}</h4>
								<Button
									variant={"ghost"}
									size={"icon"}
									className="size-6"
									onClick={onClearFilter}
								>
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

	const onChangeRef = useRef(onChange);
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

interface DebouncedCheckboxProps extends Omit<React.ComponentProps<typeof Checkbox>, "onCheckedChange"> {
	checked: boolean;
	onCheckedChange: (value: boolean) => void;
	debounce?: number;
}

const DebouncedCheckbox = ({ checked, onCheckedChange, debounce = 150, ...props }: DebouncedCheckboxProps) => {
	const [localValue, setLocalValue] = useState(checked);

	const onChangeRef = useRef(onCheckedChange);
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

	return (
		<Checkbox
			{...props}
			checked={localValue}
			onCheckedChange={() => onCheckedChange(!localValue)}
		/>
	);

	//return <Input {...props} value={localValue} onChange={(e) => setLocalValue(e.target.value)} />;
};
