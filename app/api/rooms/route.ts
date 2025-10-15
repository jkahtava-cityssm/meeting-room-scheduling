import { guardRoute } from "@/lib/api-guard";
import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    [
      { type: "permission", resource: "Room", action: "Read" },
      { type: "role", role: "Admin" },
    ],
    async () => {
      const rooms = await prisma.room.findMany();

      if (!rooms) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Rooms", rooms);
    }
  );
}
