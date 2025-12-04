import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

// Standard event include configuration — used across all DAL functions
const EVENT_INCLUDE = {
  room: { include: { roomScope: true, roomCategory: true, roomProperty: true } },
  recurrence: true,
  status: true,
} as const satisfies Prisma.EventInclude;

// Create an event — the DAL controls which relations are included.
export async function createEvent(data: Prisma.EventCreateInput) {
  return prisma.event.create({
    data,
    include: EVENT_INCLUDE,
  });
}

// Upsert — accept explicit where/create/update; include relations internally
export async function upsertEvent(params: {
  where: Prisma.EventWhereUniqueInput;
  create: Prisma.EventCreateInput;
  update: Prisma.EventUpdateInput;
}) {
  return prisma.event.upsert({
    where: params.where,
    create: params.create,
    update: params.update,
    include: EVENT_INCLUDE,
  });
}

export async function updateEvent(params: { where: Prisma.EventWhereUniqueInput; data: Prisma.EventUpdateInput }) {
  return prisma.event.update({
    where: params.where,
    data: params.data,
    include: EVENT_INCLUDE,
  });
}

// Find many events — only accept a where clause; DAL applies the include.
export async function findManyEvents(where?: Prisma.EventWhereInput) {
  return prisma.event.findMany({
    where,
    include: EVENT_INCLUDE,
  });
}

export async function deleteManyEvents(where?: Prisma.EventWhereInput) {
  return prisma.event.deleteMany({ where });
}

export async function countEvents(where?: Prisma.EventWhereInput) {
  return prisma.event.count({ where });
}

export async function findFirstEvent(where?: Prisma.EventWhereInput) {
  return prisma.event.findFirst({ where });
}
