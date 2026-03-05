import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

const PUBLIC_EVENT_SELECT = {
	eventId: true,
	endDate: true,
	startDate: true,
	recurrenceId: true,
	recurrence: { select: { rule: true, endDate: true, startDate: true } },
	roomId: true,
	room: { select: { name: true, color: true } },
	status: { select: { statusId: true, name: true, key: true } },
} as const satisfies Prisma.EventSelect;

export async function findPublicEvents(where?: Prisma.EventWhereInput, tx: Prisma.TransactionClient = prisma) {
	return tx.event.findMany({
		where,
		select: PUBLIC_EVENT_SELECT,
	});
}

const ROOM_SELECT = {
	roomId: true,
	name: true,
	color: true,
	roomCategory: { select: { roomCategoryId: true, name: true } },
	roomProperty: {
		select: {
			value: true,
			property: { select: { name: true, type: true } },
		},
	},
} as const satisfies Prisma.RoomSelect;

export async function findPublicRooms(where?: Prisma.RoomWhereInput, tx: Prisma.TransactionClient = prisma) {
	return tx.room.findMany({
		where,
		select: ROOM_SELECT,
	});
}
