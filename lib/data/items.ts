import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

const ITEM_SELECT = {
  itemId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ItemSelect;

export async function findManyItems(where?: Prisma.ItemWhereInput, tx: Prisma.TransactionClient = prisma) {
  const Items = await tx.item.findMany({
    where,
    select: ITEM_SELECT,
    orderBy: [{ itemId: "asc" }],
  });

  return Items;
}
