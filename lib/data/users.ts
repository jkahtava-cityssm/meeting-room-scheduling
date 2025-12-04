import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

// Standard user select configuration — used across all DAL functions
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
} as const satisfies Prisma.UserSelect;

// Standard session select configuration — used across all DAL functions
const SESSION_SELECT = {
  userId: true,
  expiresAt: true,
} as const satisfies Prisma.SessionSelect;

export async function findManyUsers(where?: Prisma.UserWhereInput) {
  return prisma.user.findMany({ where, select: USER_SELECT });
}

export async function findSession(where: Prisma.SessionWhereInput) {
  return prisma.session.findFirst({ where, select: SESSION_SELECT });
}
