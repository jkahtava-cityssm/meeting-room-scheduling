import { prisma } from "@/prisma";
import { BadRequestMessage, DeleteMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  return guardRoute(request, { type: "permission", resource: "Event", action: "Read" }, async () => {
    const { eventId } = await params;
    if (!eventId || isNaN(Number(eventId))) {
      return BadRequestMessage();
    }

    const events = await prisma.event.findMany({
      include: {
        room: { include: { roomScope: true, roomCategory: true, roomProperty: true } },
        recurrence: true,
        status: true,
      },
      where: { eventId: parseInt(eventId) },
    });

    if (!events) {
      return InternalServerErrorMessage();
    }

    return SuccessMessage("Collected Events", events);
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  return guardRoute(
    request,
    { type: "permission", resource: "Event", action: "Delete" },

    async () => {
      const { eventId } = await params;
      if (!eventId || isNaN(Number(eventId))) {
        return BadRequestMessage();
      }

      const totalDeleted = await prisma.event.deleteMany({
        where: { eventId: parseInt(eventId) },
      });

      if (!totalDeleted) {
        return InternalServerErrorMessage();
      }

      return DeleteMessage();
    }
  );
}
