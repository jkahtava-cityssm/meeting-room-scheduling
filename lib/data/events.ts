import { prisma } from '@/prisma';
import type { Prisma } from '@prisma/client';
import { SEvent } from '../schemas';
import z from 'zod/v4';
import { safeCreateMany } from '../api-helpers';
import crypto from 'crypto';
import { TStatusKey } from '../types';
import { upsertRecurrence } from './recurrence';

const unique = <T>(array: T[]): T[] => [...new Set(array)];

function categorizeDatabaseChanges(incoming: number[], existing: number[]) {
  const incomingSet = new Set(incoming);
  const existingSet = new Set(existing);

  return {
    toAdd: incoming.filter((id) => !existingSet.has(id)),
    toDelete: existing.filter((id) => !incomingSet.has(id)),
  };
}

const DATABASE_NAME = process.env.DATABASE_NAME || 'Unknown';

// Standard event include configuration — used across all DAL functions
const EVENT_INCLUDE = {
  eventRooms: { include: { room: { include: { roomCategory: true, roomProperty: { include: { property: true } } } } } },
  eventItems: { include: { item: true } },
  eventRecipients: true,
  recurrence: true,
  status: true,
  statusHistory: {
    include: { status: true },
    orderBy: { changedAt: 'asc' },
  },
  user: { select: { name: true, email: true } },
  createdByUser: { select: { name: true } },
  updatedByUser: { select: { name: true } },
} as const satisfies Prisma.EventInclude;

interface EventData {
  eventId?: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  statusId: number;
  userId?: number;

  eventRooms: number[];
  eventItems?: number[];
  eventRecipients?: number[];

  recurrenceId?: number;
  rule?: string;
  ruleDescription?: string;
  ruleStartDate?: Date;
  ruleEndDate?: Date;
}

async function createEvent(data: EventData, sessionUserId: number) {
  const uid = `${crypto.randomUUID()}@${DATABASE_NAME}`;

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      ...(data.recurrenceId && { recurrence: { connect: { recurrenceId: data.recurrenceId } } }),
      sequence: 0,
      uid: uid,
      status: { connect: { statusId: data.statusId } },
      statusHistory: {
        create: {
          statusId: data.statusId,
          changedBy: sessionUserId,
        },
      },
      ...(data.userId && { user: { connect: { id: data.userId } } }),
      createdByUser: { connect: { id: sessionUserId } },
      updatedByUser: { connect: { id: sessionUserId } },
    },
    select: { eventId: true },
  });

  return event.eventId;
}

async function updateEvent(data: EventData, sessionUserId: number) {
  const event = await prisma.event.update({
    where: { eventId: data.eventId },
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      ...(data.recurrenceId && { recurrence: { connect: { recurrenceId: data.recurrenceId } } }),
      sequence: { increment: 1 },
      status: { connect: { statusId: data.statusId } },
      ...(data.userId && { user: { connect: { id: data.userId } } }),
      updatedByUser: { connect: { id: sessionUserId } },
    },
    select: { eventId: true },
  });

  return event.eventId;
}

export async function upsertEvent(data: EventData, sessionUserId: number) {
  let updatedRecurrenceId = data.recurrenceId;

  if (data.rule && data.ruleStartDate && data.ruleEndDate && data.ruleDescription) {
    const recurrence = await upsertRecurrence(
      {
        recurrenceId: data.recurrenceId,
        rule: data.rule,
        description: data.ruleDescription,
        startDate: data.ruleStartDate,
        endDate: data.ruleEndDate,
      },
      sessionUserId,
    );
    updatedRecurrenceId = recurrence?.recurrenceId;
  } else if (data.recurrenceId) {
    await prisma.recurrence.delete({ where: { recurrenceId: data.recurrenceId } });
    updatedRecurrenceId = undefined;
  }

  const existingEvent = data.eventId
    ? await prisma.event.findFirst({
        where: { eventId: data.eventId },
        select: {
          eventId: true,
          statusId: true,
          eventItems: { select: { itemId: true } },
          eventRooms: { select: { roomId: true } },
          eventRecipients: { select: { userId: true } },
        },
      })
    : null;

  // Extract the existing IDs
  const existingRoomIds = existingEvent?.eventRooms.map((r) => r.roomId) ?? [];
  const existingItemIds = existingEvent?.eventItems.map((i) => i.itemId) ?? [];
  const existingRecipientIds = existingEvent?.eventRecipients.map((r) => r.userId) ?? [];

  // 2. Calculate the differences
  const roomChanges = categorizeDatabaseChanges(data.eventRooms, existingRoomIds);
  const itemChanges = categorizeDatabaseChanges(data.eventItems ?? [], existingItemIds);
  const recipientChanges = categorizeDatabaseChanges(data.eventRecipients ?? [], existingRecipientIds);

  const basePayload = { ...data, recurrenceId: updatedRecurrenceId };

  let eventId;

  if (existingEvent) {
    eventId = await updateEvent(basePayload, sessionUserId);

    if (existingEvent?.statusId !== data.statusId) {
      await prisma.eventStatusHistory.create({ data: { eventId: eventId, statusId: data.statusId, changedBy: sessionUserId } });
    }
  } else {
    eventId = await createEvent(basePayload, sessionUserId);
  }

  for (const roomId of roomChanges.toDelete) {
    await prisma.eventRoom.delete({ where: { eventId_roomId: { eventId: eventId, roomId: roomId } } });
  }
  for (const roomId of roomChanges.toAdd) {
    await prisma.eventRoom.create({ data: { eventId: eventId, roomId: roomId, createdBy: sessionUserId, updatedBy: sessionUserId } });
  }

  for (const itemId of itemChanges.toDelete) {
    await prisma.eventItem.delete({ where: { eventId_itemId: { eventId: eventId, itemId: itemId } } });
  }
  for (const itemId of itemChanges.toAdd) {
    await prisma.eventItem.create({ data: { eventId: eventId, itemId: itemId, createdBy: sessionUserId, updatedBy: sessionUserId } });
  }

  for (const recipientId of recipientChanges.toDelete) {
    await prisma.eventRecipient.delete({ where: { eventId_userId: { eventId: eventId, userId: recipientId } } });
  }
  for (const recipientId of recipientChanges.toAdd) {
    await prisma.eventRecipient.create({ data: { eventId: eventId, userId: recipientId, createdBy: sessionUserId, updatedBy: sessionUserId } });
  }

  const updatedEvent = await prisma.event.findUnique({
    where: { eventId: eventId },
    include: EVENT_INCLUDE,
  });

  if (!updatedEvent) throw new Error('Event Upsert Failed.');

  return flattenEvent(updatedEvent);
}

export async function patchEvent(data: Partial<EventData> & { eventId: number }, sessionUserId: number) {
  let updatedRecurrenceId = data.recurrenceId;

  // 1. Handle Recurrence Logic
  if (data.rule && data.ruleStartDate && data.ruleEndDate && data.ruleDescription) {
    const recurrence = await upsertRecurrence(
      {
        recurrenceId: data.recurrenceId,
        rule: data.rule,
        description: data.ruleDescription,
        startDate: data.ruleStartDate,
        endDate: data.ruleEndDate,
      },
      sessionUserId,
    );
    updatedRecurrenceId = recurrence?.recurrenceId;
  } else if (data.recurrenceId === null) {
    // If explicitly setting recurrenceId to null, break the connection / delete it
    await prisma.recurrence.delete({ where: { recurrenceId: data.recurrenceId } });
    updatedRecurrenceId = undefined;
  }

  // 2. Fetch existing relations *only* for fields provided in the patch data
  const existingEvent = await prisma.event.findUnique({
    where: { eventId: data.eventId },
    select: {
      statusId: true,
      eventRooms: data.eventRooms !== undefined ? { select: { roomId: true } } : false,
      eventItems: data.eventItems !== undefined ? { select: { itemId: true } } : false,
      eventRecipients: data.eventRecipients !== undefined ? { select: { userId: true } } : false,
    },
  });

  if (!existingEvent) throw new Error('Event not found.');

  // 3. Update the base Event record
  await prisma.event.update({
    where: { eventId: data.eventId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.statusId !== undefined && { status: { connect: { statusId: data.statusId } } }),
      ...(data.userId !== undefined && { user: data.userId ? { connect: { id: data.userId } } : { disconnect: true } }),
      ...(updatedRecurrenceId && { recurrence: { connect: { recurrenceId: updatedRecurrenceId } } }),
      ...(data.recurrenceId === null && { recurrence: { disconnect: true } }),
      updatedByUser: { connect: { id: sessionUserId } },
      sequence: { increment: 1 },
    },
  });

  // 4. Handle Status History Log if changed
  if (data.statusId !== undefined && existingEvent.statusId !== data.statusId) {
    await prisma.eventStatusHistory.create({
      data: { eventId: data.eventId, statusId: data.statusId, changedBy: sessionUserId },
    });
  }

  // 5. Categorize and process relational updates conditionally

  // Rooms
  if (data.eventRooms !== undefined) {
    const existingRoomIds = existingEvent.eventRooms?.map((r) => r.roomId) ?? [];
    const roomChanges = categorizeDatabaseChanges(data.eventRooms, existingRoomIds);

    for (const roomId of roomChanges.toDelete) {
      await prisma.eventRoom.delete({ where: { eventId_roomId: { eventId: data.eventId, roomId } } });
    }
    for (const roomId of roomChanges.toAdd) {
      await prisma.eventRoom.create({ data: { eventId: data.eventId, roomId, createdBy: sessionUserId, updatedBy: sessionUserId } });
    }
  }

  // Items
  if (data.eventItems !== undefined) {
    const existingItemIds = existingEvent.eventItems?.map((i) => i.itemId) ?? [];
    const itemChanges = categorizeDatabaseChanges(data.eventItems, existingItemIds);

    for (const itemId of itemChanges.toDelete) {
      await prisma.eventItem.delete({ where: { eventId_itemId: { eventId: data.eventId, itemId } } });
    }
    for (const itemId of itemChanges.toAdd) {
      await prisma.eventItem.create({ data: { eventId: data.eventId, itemId, createdBy: sessionUserId, updatedBy: sessionUserId } });
    }
  }

  // Recipients
  if (data.eventRecipients !== undefined) {
    const existingRecipientIds = existingEvent.eventRecipients?.map((r) => r.userId) ?? [];
    const recipientChanges = categorizeDatabaseChanges(data.eventRecipients, existingRecipientIds);

    for (const recipientId of recipientChanges.toDelete) {
      await prisma.eventRecipient.delete({ where: { eventId_userId: { eventId: data.eventId, userId: recipientId } } });
    }
    for (const recipientId of recipientChanges.toAdd) {
      await prisma.eventRecipient.create({
        data: { eventId: data.eventId, userId: recipientId, createdBy: sessionUserId, updatedBy: sessionUserId },
      });
    }
  }

  // 6. Fetch full updated object to match your return pattern
  const updatedEvent = await prisma.event.findUnique({
    where: { eventId: data.eventId },
    include: EVENT_INCLUDE,
  });

  if (!updatedEvent) throw new Error('Event Update Failed.');

  return flattenEvent(updatedEvent);
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

export type IFlattenedEvent = z.input<typeof SEvent>;

function flattenEvent(event: EventWithRelations): IFlattenedEvent;
function flattenEvent(event: EventWithRelations[]): IFlattenedEvent[];

function flattenEvent(data: EventWithRelations | EventWithRelations[]): IFlattenedEvent | IFlattenedEvent[] {
  const isArray = Array.isArray(data);
  const events = isArray ? data : [data];

  const mapped = events.map((event) => {
    const { user, statusHistory } = event;

    const firstApprovedHistory = statusHistory?.find((history) => (history.status.key as TStatusKey) === 'APPROVED');

    return {
      ...event,
      wasApproved: firstApprovedHistory ? true : false,
      userName: user?.name,
      userEmail: user?.email,
      createdBy: event.createdByUser.name,
      updatedBy: event.updatedByUser.name,
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
  const insertData: Prisma.EventRoomCreateManyInput[] = data.eventRooms.map((roomId) => ({
    eventId: data.eventId,
    roomId,
    createdBy: sessionUserId,
    updatedBy: sessionUserId,
  }));

  return await safeCreateMany(tx.eventRoom, insertData, ['eventId', 'roomId'], tx);
}

export async function createManyEventRecipients(
  data: {
    eventId: number;
    eventRecipients: number[];
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const insertData: Prisma.EventRecipientCreateManyInput[] = data.eventRecipients.map((userId) => ({
    eventId: data.eventId,
    userId,
    createdBy: sessionUserId,
    updatedBy: sessionUserId,
  }));

  return await safeCreateMany(tx.eventRecipient, insertData, ['eventId', 'userId'], tx);
}

export async function createManyEventItems(
  data: {
    eventId: number;
    eventItems: number[];
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const insertData: Prisma.EventItemCreateManyInput[] = data.eventItems.map((itemId) => ({
    eventId: data.eventId,
    itemId,
    createdBy: sessionUserId,
    updatedBy: sessionUserId,
  }));

  return await safeCreateMany(tx.eventItem, insertData, ['eventId', 'itemId'], tx);
}

export async function getConflictingEvents({
  roomIds,
  startDate,
  endDate,
  statusKey,
  bufferMinutes,
  excludeEventId,
}: {
  roomIds: number[];
  startDate: Date;
  endDate: Date;
  statusKey: TStatusKey;
  bufferMinutes: number;
  excludeEventId?: number;
}) {
  if (statusKey !== 'APPROVED') {
    return [];
  }

  const bufferMs = bufferMinutes * 60 * 1000;
  const bufferedStartDate = new Date(startDate.getTime() - bufferMs);
  const bufferedEndDate = new Date(endDate.getTime() + bufferMs);

  return await prisma.eventRoom.findMany({
    where: {
      roomId: { in: roomIds },
      event: {
        ...(excludeEventId && { NOT: { eventId: excludeEventId } }),
        startDate: { lt: bufferedEndDate },
        endDate: { gt: bufferedStartDate },
        status: { key: { equals: 'APPROVED' as TStatusKey } },
      },
    },
    select: {
      roomId: true,
      event: {
        select: {
          eventId: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });
}
