import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

export async function findManyUsers(where?: Prisma.UserWhereInput) {
  return prisma.user.findMany({ where, select: { id: true, name: true, email: true } });
}

export async function findSession(where: Prisma.SessionWhereInput) {
  return prisma.session.findFirst({ where, select: { userId: true, expiresAt: true } });
}
