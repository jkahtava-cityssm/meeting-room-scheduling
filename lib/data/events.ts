import { prisma } from '@/prisma';
import type { Prisma } from '@prisma/client';
import { SEvent } from '../schemas';
import z from 'zod/v4';

// Standard event include configuration — used across all DAL functions
const EVENT_INCLUDE = {
  eventRooms: { include: { room: { include: { roomCategory: true, roomProperty: { include: { property: true } } } } } },
  eventItems: { include: { item: true } },
  eventRecipients: true,
  recurrence: true,
  status: true,
  user: { select: { name: true, email: true } },
} as const satisfies Prisma.EventInclude;

// Create an event — the DAL controls which relations are included.
export async function createEvent(
  data: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    roomIds: number[];
    statusId: number;
    recurrenceId?: number;
    userId?: number;
    itemIds?: number[];
    recipientIds?: number[];
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const event = await tx.event.create({
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      eventRooms: {
        createMany: {
          data: data.roomIds.map((roomId: number) => ({ roomId })),
        },
      },
      ...(data.recurrenceId && { recurrence: { connect: { recurrenceId: data.recurrenceId } } }),
      status: { connect: { statusId: data.statusId } },
      ...(data.userId && { user: { connect: { id: data.userId } } }),
      ...(data.itemIds && {
        eventItems: {
          createMany: {
            data: data.itemIds.map((itemId) => ({ itemId })),

            skipDuplicates: true,
          },
        },
      }),
      ...(data.recipientIds && {
        eventRecipients: {
          createMany: {
            data: data.recipientIds.map((eventRecipientId) => ({ userId: eventRecipientId })),

            skipDuplicates: true,
          },
        },
      }),
      createdByUser: { connect: { id: sessionUserId } },
      updatedByUser: { connect: { id: sessionUserId } },
    },
    include: EVENT_INCLUDE,
  });

  return flattenEvent(event);
}

export async function upsertEvent(
  data: {
    eventId?: number;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    roomIds: number[];
    statusId: number;
    recurrenceId?: number;
    userId?: number;
    itemIds?: number[];
    recipientIds?: number[];
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const input = {
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    eventRooms: {
      createMany: {
        data: data.roomIds.map((roomId: number) => ({ roomId })),
      },
    },
    ...(data.recurrenceId && { recurrence: { connect: { recurrenceId: data.recurrenceId } } }),
    status: { connect: { statusId: data.statusId } },
    ...(data.userId && { user: { connect: { id: data.userId } } }),
    ...(data.itemIds && {
      eventItems: {
        createMany: {
          data: data.itemIds.map((itemId) => ({ itemId })),

          skipDuplicates: true,
        },
      },
    }),
    ...(data.recipientIds && {
      eventRecipients: {
        createMany: {
          data: data.recipientIds.map((eventRecipientId) => ({ userId: eventRecipientId })),
          skipDuplicates: true,
        },
      },
    }),
  };

  const event = await tx.event.upsert({
    where: { eventId: data.eventId },
    create: { ...input, createdByUser: { connect: { id: sessionUserId } }, updatedByUser: { connect: { id: sessionUserId } } },
    update: { ...input, updatedByUser: { connect: { id: sessionUserId } } },
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
export async function findManyEvents(where?: Prisma.EventWhereInput, tx: Prisma.TransactionClient = prisma) {
  const events = await tx.event.findMany({
    where,
    include: EVENT_INCLUDE,
    orderBy: { eventId: 'asc' },
  });
  return flattenEvent(events);
}

export async function deleteManyEvents(where?: Prisma.EventWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.event.deleteMany({ where });
}

export async function countEvents(where?: Prisma.EventWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.event.count({ where });
}

export async function findFirstEvent(where?: Prisma.EventWhereInput, tx: Prisma.TransactionClient = prisma) {
  const event = await tx.event.findFirstOrThrow({ where, include: EVENT_INCLUDE, orderBy: { eventId: 'asc' } });

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

  const mapped = events.map((event) => {
    //Remove User Property
    const { user, ...other } = event;

    return {
      ...event,
      userName: user?.name,
      userEmail: user?.email,

      eventItems: event.eventItems
        ? event.eventItems.map((eventItem) => {
            return {
              eventItemId: eventItem.eventItemId,
              itemId: eventItem.itemId,
              name: eventItem.item.name,
            };
          })
        : [],
      eventRecipients: event.eventRecipients
        ? event.eventRecipients.map((recipient) => {
            return {
              eventRecipientId: recipient.eventRecipientId,
              userId: recipient.userId,
            };
          })
        : [],
      eventRooms: event.eventRooms
        ? event.eventRooms.map((eventRoom) => {
            return {
              ...eventRoom.room,
              roomProperty: eventRoom.room.roomProperty.map((roomProperty) => {
                return {
                  roomPropertyId: roomProperty.roomPropertyId,
                  propertyId: roomProperty.property.propertyId,
                  name: roomProperty.property.name,
                  value: roomProperty.value ?? '',
                  type: roomProperty.property.type,
                  createdAt: roomProperty.createdAt,
                  updatedAt: roomProperty.updatedAt,
                };
              }),
            };
          })
        : [],
    };
  });

  return isArray ? mapped : mapped[0];
}

export async function createManyEventRoom(
  data: {
    eventId: number;
    eventRooms: number[];
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.eventRoom.createMany({
    data: data.eventRooms.map((roomId) => {
      return { eventId: data.eventId, roomId: roomId, createdBy: sessionUserId, updatedBy: sessionUserId };
    }),
    skipDuplicates: true,
  });
}

export async function createManyEventRecipients(
  data: {
    eventId: number;
    eventRecipients: number[];
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.eventRecipient.createMany({
    data: data.eventRecipients.map((eventRecipientId) => {
      return { eventId: data.eventId, userId: eventRecipientId, createdBy: sessionUserId, updatedBy: sessionUserId };
    }),
    skipDuplicates: true,
  });
}

export async function createManyEventItems(
  data: {
    eventId: number;
    eventItems: number[];
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.eventItem.createMany({
    data: data.eventItems.map((itemId) => {
      return { eventId: data.eventId, itemId: itemId, createdBy: sessionUserId, updatedBy: sessionUserId };
    }),
    skipDuplicates: true,
  });
}
