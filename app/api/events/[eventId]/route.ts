import { prisma } from "@/prisma";
import { NextResponse } from "next/server";
import { BadRequestMessage, DeleteMessage, InternalServerErrorMessage, SuccessMessage } from "../../lib/status-codes";

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
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
