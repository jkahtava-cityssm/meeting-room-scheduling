import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { PUBLIC_IROOM } from "../services/public";

const PUBLIC_EVENT_SELECT = {
  eventId: true,
  endDate: true,
  startDate: true,
  recurrenceId: true,
  recurrence: { select: { rule: true, endDate: true, startDate: true } },
  eventRooms: { select: { room: { select: { roomId: true, name: true, color: true } } } },
  status: { select: { statusId: true, name: true, key: true } },
} as const satisfies Prisma.EventSelect;

export async function findPublicEvents(where?: Prisma.EventWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.event.findMany({
    where,
    select: PUBLIC_EVENT_SELECT,
    orderBy: { eventId: "asc" },
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
  const rooms = await tx.room.findMany({
    where,
    select: ROOM_SELECT,
    orderBy: [{ displayOrder: { sort: "asc", nulls: "last" } }, { roomId: "asc" }],
  });

  return flattenPublicRoom(rooms);
}

type RoomWithRelations = Prisma.RoomGetPayload<{ select: typeof ROOM_SELECT }>;

function flattenPublicRoom(room: RoomWithRelations): PUBLIC_IROOM;
function flattenPublicRoom(rooms: RoomWithRelations[]): PUBLIC_IROOM[];

function flattenPublicRoom(data: RoomWithRelations | RoomWithRelations[]): PUBLIC_IROOM | PUBLIC_IROOM[] {
  const isArray = Array.isArray(data);
  const rooms = isArray ? data : [data];

  const mapped = rooms.map((room) => {
    return {
      roomId: room.roomId,
      name: room.name,
      color: room.color,
      roomCategory: {
        roomCategoryId: room.roomCategory.roomCategoryId,
        name: room.roomCategory.name,
      },
      roomProperty: room.roomProperty.map((roomProperty) => {
        return {
          name: roomProperty.property.name,
          value: roomProperty.value ?? "",
          type: roomProperty.property.type,
        };
      }),
    };
  });

  return isArray ? mapped : mapped[0];
}
