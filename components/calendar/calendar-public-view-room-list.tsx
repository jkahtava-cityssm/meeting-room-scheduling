"use client";
import { PUBLIC_IROOM } from "@/services/public";
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { FilterIcon } from "lucide-react";

function useDebouncedToggle(delay: number = 100) {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const queueRef = useRef<number[]>([]);

	const debounceToggle = (roomId: number, toggleFn: (id: number) => void) => {
		queueRef.current.push(roomId);

		if (timeoutRef.current) clearTimeout(timeoutRef.current);

		timeoutRef.current = setTimeout(() => {
			const uniqueIds = Array.from(new Set(queueRef.current));
			uniqueIds.forEach(id => toggleFn(id));
			queueRef.current = [];
		}, delay);
	};

	return debounceToggle;
}

export const RoomCategoryLayout = ({
	rooms,
	onCheckedRoomsChange,
}: {
	rooms: PUBLIC_IROOM[];
	onCheckedRoomsChange?: (checkedRoomIds: number[]) => void;
}) => {
	const [checkedRooms, setCheckedRooms] = useState<Set<number>>(() => new Set(rooms.map(room => room.roomId)));

	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	const debouncedToggleRoom = useDebouncedToggle(150);

	const toggleRoom = (roomId: number) => {
		setCheckedRooms(prev => {
			const newSet = new Set(prev);
			if (newSet.has(roomId)) {
				newSet.delete(roomId);
			} else {
				newSet.add(roomId);
			}
			return newSet;
		});
	};

	const filterRoom = () => {
		const roomsWithProjectors = rooms
			.filter(room => (room.roomProperty ?? []).some(properties => properties.name === "HasProjector" && properties.value === "true"))
			.map(room => room.roomId);

		const newSet = new Set(roomsWithProjectors);

		setCheckedRooms(newSet);
	};

	const handleRoomClick = (roomId: number) => {
		debouncedToggleRoom(roomId, toggleRoom);
	};

	useEffect(() => {
		if (!onCheckedRoomsChange) return;

		if (debounceRef.current) clearTimeout(debounceRef.current);

		debounceRef.current = setTimeout(() => {
			console.log("Checked rooms changed:");
			onCheckedRoomsChange(Array.from(checkedRooms));
		}, 300);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [checkedRooms, onCheckedRoomsChange]);

	const { roomsByCategory, rows } = useMemo(() => {
		const roomsByCategory: Record<string, PUBLIC_IROOM[]> = {};
		const categoryCounts: Record<string, number> = {};

		for (const room of rooms) {
			const category = room.roomCategory.name;
			if (!roomsByCategory[category]) roomsByCategory[category] = [];
			roomsByCategory[category].push(room);
			categoryCounts[category] = (categoryCounts[category] || 0) + 1;
		}

		const sortedCategories = Object.entries(categoryCounts).sort(([, countA], [, countB]) => countB - countA);

		const rows: { left: string; right: string[] }[] = [];

		while (sortedCategories.length > 0) {
			const shifted = sortedCategories.shift();
			if (!shifted) break;
			const [leftCategory, leftCount] = shifted;
			const rightCategories: [string, number][] = [];
			let rightTotal = 0;

			for (let i = 0; i < sortedCategories.length; ) {
				const [cat, count] = sortedCategories[i];
				if (rightTotal < leftCount) {
					rightCategories.push([cat, count]);
					rightTotal += count;
					sortedCategories.splice(i, 1);
				} else {
					i++;
				}
			}

			if (rightTotal > leftCount + 3 && rightCategories.length > 0) {
				const [lastCat, lastCount] = rightCategories[rightCategories.length - 1];
				rightTotal -= lastCount;
				sortedCategories.unshift([lastCat, lastCount]);
				rightCategories.pop();
			}

			rows.push({
				left: leftCategory,
				right: rightCategories.map(([cat]) => cat),
			});
		}

		return { roomsByCategory, rows };
	}, [rooms]);

	return (
		<div className="flex-1 space-y-6 w-(--public-calendar-filter-w-fluid)">
			<div className="grid grid-cols-fluid2  gap-y-2 w-full border-b py-4 mb-4">
				<Label className="text-md font-bold">Meeting Room Filters</Label>
				<Button
					size="sm"
					className="text-xs w-50"
					onClick={filterRoom}
				>
					<FilterIcon></FilterIcon> Select Rooms with Projectors
				</Button>
			</div>

			{rows.map((row, index) => (
				<div
					key={index}
					className="grid grid-cols-fluid2  gap-4 w-full"
				>
					<Group
						categories={[row.left]}
						roomsByCategory={roomsByCategory}
						checkedRooms={checkedRooms}
						toggleRoom={toggleRoom}
					></Group>
					<Group
						categories={row.right}
						roomsByCategory={roomsByCategory}
						checkedRooms={checkedRooms}
						toggleRoom={toggleRoom}
					></Group>
				</div>
			))}
		</div>
	);
};

const Group = ({
	categories,
	roomsByCategory,
	checkedRooms,
	toggleRoom,
}: {
	categories: string[];
	roomsByCategory: Record<string, PUBLIC_IROOM[]>;
	checkedRooms: Set<number>;
	toggleRoom: (roomId: number) => void;
}) => {
	return (
		<div className="flex flex-col gap-4 w-45">
			{categories.map(category => (
				<GroupHeader
					key={category}
					category={category}
				>
					{roomsByCategory[category]?.map(room => {
						return (
							<GroupRow
								key={room.roomId}
								room={room}
								checkedRooms={checkedRooms}
								toggleRoom={toggleRoom}
							/>
						);
					})}
				</GroupHeader>
			))}
		</div>
	);
};

const GroupHeader = ({ category, children }: { category: string; children: React.ReactNode }) => {
	return (
		<div className="flex flex-col">
			<Label className="text-lg font-bold">{category}</Label>
			<div className="mt-2 space-y-2">{children}</div>
		</div>
	);
};

const GroupRow = ({ room, checkedRooms, toggleRoom }: { room: PUBLIC_IROOM; checkedRooms: Set<number>; toggleRoom: (roomId: number) => void }) => {
	return (
		<div className="flex items-center gap-2">
			<Checkbox
				id={`room-${room.roomId}`}
				checked={checkedRooms.has(room.roomId)}
				onCheckedChange={() => toggleRoom(room.roomId)}
			/>
			<Label
				htmlFor={`room-${room.roomId}`}
				className="text-sm font-medium"
			>
				{room.name}
			</Label>
		</div>
	);
};
