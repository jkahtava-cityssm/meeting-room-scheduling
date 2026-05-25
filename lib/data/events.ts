import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';
import { SEvent } from '../schemas';
import z from 'zod/v4';
import { safeCreateMany } from '../api-helpers';

const unique = <T>(array: T[]): T[] => Array.from(new Set(array));

// Standard event include configuration — used across all DAL functions
const EVENT_INCLUDE = {
  eventRooms: { include: { room: { include: { roomCategory: true, roomProperty: { include: { property: true } } } } } },
  eventItems: { include: { item: true } },
  eventRecipients: true,
  recurrence: true,
  status: true,
  user: { select: { name: true, email: true } },
  createdByUser: { select: { name: true } },
  updatedByUser: { select: { name: true } },
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
          data: unique(data.roomIds).map((roomId: number) => ({ roomId, createdBy: sessionUserId, updatedBy: sessionUserId })),
        },
      },
      ...(data.recurrenceId && { recurrence: { connect: { recurrenceId: data.recurrenceId } } }),
      status: { connect: { statusId: data.statusId } },
      ...(data.userId && { user: { connect: { id: data.userId } } }),
      ...(data.itemIds && {
        eventItems: {
          createMany: {
            data: unique(data.itemIds).map((itemId) => ({ itemId, createdBy: sessionUserId, updatedBy: sessionUserId })),
          },
        },
      }),
      ...(data.recipientIds && {
        eventRecipients: {
          createMany: {
            data: unique(data.recipientIds).map((eventRecipientId) => ({
              userId: eventRecipientId,
              createdBy: sessionUserId,
              updatedBy: sessionUserId,
            })),
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
    statusId: number;
    recurrenceId?: number;
    userId?: number;
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const contextInfo = `[EventId: ${data.eventId ?? 'NEW'}, Title: ${data.title}, User: ${sessionUserId}]`;

  // Dynamically build up the relational connection payload
  const inputData = {
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    status: { connect: { statusId: data.statusId } },
    ...(data.recurrenceId && { recurrence: { connect: { recurrenceId: data.recurrenceId } } }),
    ...(data.userId && { user: { connect: { id: data.userId } } }),
    updatedByUser: { connect: { id: sessionUserId } },
  };

  // Scenario A: No eventId provided means it is explicitly a brand new record
  if (!data.eventId) {
    try {
      const event = await tx.event.create({
        data: {
          ...inputData,
          createdByUser: { connect: { id: sessionUserId } },
        },
        include: EVENT_INCLUDE,
      });
      return flattenEvent(event);
    } catch (err) {
      console.error(`[Event] Failed to create new event ${contextInfo}:`, err);
      throw new Error(`Database error encountered while creating new event`, { cause: err });
    }
  }

  // Scenario B: EventId exists, execute the concurrency-safe update-first strategy
  try {
    // Optimistically assume the record exists and update it
    const event = await tx.event.update({
      where: { eventId: data.eventId },
      data: inputData,
      include: EVENT_INCLUDE,
    });
    return flattenEvent(event);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record to update not found (concurrency fallback window)
      if (err.code === 'P2025') {
        try {
          const event = await tx.event.create({
            data: {
              ...inputData,
              createdByUser: { connect: { id: sessionUserId } },
            },
            include: EVENT_INCLUDE,
          });
          return flattenEvent(event);
        } catch (createErr) {
          console.error(`[Event] Concurrency fallback create failed for ${contextInfo}:`, createErr);
          throw new Error(`Failed to create event after missing update check`, { cause: createErr });
        }
      }

      console.error(`[Event] Database error during update ${contextInfo}:`, err);
      throw new Error(`Database error while updating event data (Prisma code: ${err.code})`, { cause: err });
    }

    // Handle unexpected/generic errors
    console.error(`[Event] Unexpected error during upsertEvent ${contextInfo}:`, err);
    throw new Error(`An unexpected error occurred while saving event configurations`, { cause: err });
  }
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
    //Remove Properties
    const { user } = event;

    return {
      ...event,
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
