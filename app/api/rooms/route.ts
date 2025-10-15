import { guardRoute, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return guardRoute(req, [{ type: "permission", resource: "Room", action: "Read" }], async () => {
    const rooms = await prisma.room.findMany();

    if (!rooms) {
      return InternalServerErrorMessage();
    }

    return SuccessMessage("Collected Rooms", rooms);
  });
  /*if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const session = await getServerSession();

  if (!session || !hasServerPermission(session, "Room", "Read")) {
    return BadRequestMessage("Not Authorized");
  }

  const rooms = await prisma.room.findMany();

  if (!rooms) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Rooms", rooms);*/
}
