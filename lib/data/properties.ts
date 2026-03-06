import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

const PROPERTY_SELECT = {
  propertyId: true,
  name: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as Prisma.PropertySelect;

export async function findManyProperties(where?: Prisma.PropertyWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.property.findMany({
    where,
    select: PROPERTY_SELECT,
    orderBy: { propertyId: "asc" },
  });
}
