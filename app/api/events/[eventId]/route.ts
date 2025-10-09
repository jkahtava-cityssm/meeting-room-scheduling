import { prisma } from "@/prisma";
import { BadRequestMessage, DeleteMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { getServerSession, hasServerPermission } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const session = await getServerSession();

  if (!session || !hasServerPermission(session, "Event", "Read")) {
    return BadRequestMessage("Not Authorized");
  }

  if (!eventId || isNaN(Number(eventId))) {
    return BadRequestMessage();
  }

  const events = await prisma.event.findMany({
    include: { room: true, recurrence: true },
    where: { eventId: parseInt(eventId) },
  });

  if (!events) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Events", events);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const session = await getServerSession();

  if (!session || !hasServerPermission(session, "Event", "Delete")) {
    return BadRequestMessage("Not Authorized");
  }

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
