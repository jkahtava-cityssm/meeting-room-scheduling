import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";
import { IEvent, SEvent } from "../schemas/calendar";
import z from "zod/v4";

// Standard event include configuration — used across all DAL functions
const EVENT_INCLUDE = {
	room: { include: { roomCategory: true, roomProperty: { include: { property: true } } } },
	eventItems: { include: { item: true } },
	eventRecipients: true,
	recurrence: true,
	status: true,
} as const satisfies Prisma.EventInclude;

// Create an event — the DAL controls which relations are included.
export async function createEvent(data: Prisma.EventCreateInput, tx: Prisma.TransactionClient = prisma) {
	const event = await tx.event.create({
		data,
		include: EVENT_INCLUDE,
	});
	return flattenEvent(event);
}

// Upsert — accept explicit where/create/update; include relations internally
export async function upsertEvent(
	params: {
		where: Prisma.EventWhereUniqueInput;
		create: Prisma.EventCreateInput;
		update: Prisma.EventUpdateInput;
	},
	tx: Prisma.TransactionClient = prisma,
) {
	const event = await tx.event.upsert({
		where: params.where,
		create: params.create,
		update: params.update,
		include: EVENT_INCLUDE,
	});
	return flattenEvent(event);
}

export async function updateEvent(
	params: { where: Prisma.EventWhereUniqueInput; data: Prisma.EventUpdateInput },
	tx: Prisma.TransactionClient = prisma,
) {
	const event = await tx.event.update({
		where: params.where,
		data: params.data,
		include: EVENT_INCLUDE,
	});
	return flattenEvent(event);
}

// Find many events — only accept a where clause; DAL applies the include.
export async function findManyEvents(where?: Prisma.EventWhereInput) {
	const events = await prisma.event.findMany({
		where,
		include: EVENT_INCLUDE,
		orderBy: { eventId: "asc" },
	});
	return flattenEvent(events);
}

export async function deleteManyEvents(where?: Prisma.EventWhereInput) {
	return prisma.event.deleteMany({ where });
}

export async function countEvents(where?: Prisma.EventWhereInput) {
	return prisma.event.count({ where });
}

export async function findFirstEvent(where?: Prisma.EventWhereInput) {
	const event = await prisma.event.findFirstOrThrow({ where, include: EVENT_INCLUDE, orderBy: { eventId: "asc" } });

	if (!event) return event;

	return flattenEvent(event);
}

type EventWithRelations = Prisma.EventGetPayload<{ include: typeof EVENT_INCLUDE }>;

type IEventInput = z.input<typeof SEvent>;

function flattenEvent(event: EventWithRelations): IEventInput;
function flattenEvent(event: EventWithRelations[]): IEventInput[];

function flattenEvent(data: EventWithRelations | EventWithRelations[]): IEventInput | IEventInput[] {
	const isArray = Array.isArray(data);
	const events = isArray ? data : [data];

	const mapped = events.map(event => {
		return {
			...event,
			/*eventItem: event.eventItem?.item?.map((item) => {
        return {
          eventItemId: event.eventItem?.eventItemId,
          itemId: item.itemId,
          name: item.name,
        };
      }),*/

			eventItems: event.eventItems
				? event.eventItems.map(eventItem => {
						return {
							eventItemId: eventItem.eventItemId,
							itemId: eventItem.itemId,
							name: eventItem.item.name,
						};
					})
				: [],
			eventRecipients: event.eventRecipients
				? event.eventRecipients.map(recipient => {
						return {
							eventRecipientId: recipient.eventRecipientId,
							userId: recipient.userId,
						};
					})
				: [],
			room: {
				...event.room,
				roomProperty: event.room.roomProperty.map(roomProperty => {
					return {
						roomPropertyId: roomProperty.roomPropertyId,
						propertyId: roomProperty.property.propertyId,
						name: roomProperty.property.name,
						value: roomProperty.value ?? "",
						type: roomProperty.property.type,
						createdAt: roomProperty.createdAt,
						updatedAt: roomProperty.updatedAt,
					};
				}),
			},
		};
	});

	return isArray ? mapped : mapped[0];
}
