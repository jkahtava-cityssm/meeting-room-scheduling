import { prisma } from "@/prisma";

import { NextRequest } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { getServerSession } from "@/lib/auth";
import { guardRoute } from "@/lib/api-guard";

export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    [
      { type: "permission", resource: "Event", action: "Create" },
      { type: "role", role: "Admin" },
    ],
    async () => {
      const { title, description, startDate, endDate, roomId, rule, ruleStartDate, ruleEndDate, userId } =
        await request.json();

      if (!title || (!description && description !== "") || !startDate || !endDate || !roomId || !userId) {
        return BadRequestMessage();
      }

      let recurrence = null;

      if (rule) {
        recurrence = await prisma.recurrence.create({
          data: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
        });
      }

      const event = await prisma.event.create({
        data: {
          title,
          description,
          startDate,
          endDate,
          roomId,
          recurrenceId: recurrence ? recurrence.recurrenceId : null,
          statusId: 1,
          userId,
        },
        include: { room: true, recurrence: true },
      });

      if (!event) {
        InternalServerErrorMessage();
      }

      return CreatedMessage("Created Event", event);
    }
  );
}

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,
    [
      { type: "permission", resource: "Event", action: "Update" },
      { type: "role", role: "Admin" },
    ],
    async () => {
      const { eventData, ruleData } = await request.json();

      if (!eventData) {
        return BadRequestMessage();
      }

      if (
        eventData.title === undefined ||
        eventData.startDate === undefined ||
        eventData.endDate === undefined ||
        eventData.roomId === undefined ||
        eventData.userId === undefined
      ) {
        return BadRequestMessage();
      }

      if (
        ruleData &&
        (ruleData.rule === undefined || ruleData.ruleStartDate === undefined || ruleData.ruleEndDate === undefined)
      ) {
        return BadRequestMessage();
      }
      const { eventId, title, description, startDate, endDate, roomId, recurrenceId, userId } = eventData;
      const { rule, ruleStartDate, ruleEndDate } = ruleData || {};

      let recurrence = null;

      if (rule) {
        recurrence = await prisma.recurrence.upsert({
          create: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
          where: { recurrenceId: recurrenceId },
          update: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
        });
      }

      if (ruleData === null && recurrenceId !== null) {
        // Delete recurrence if ruleData is null and recurrenceId exists
        await prisma.recurrence.delete({
          where: { recurrenceId: recurrenceId },
        });
      }

      const event = await prisma.event.upsert({
        create: {
          title,
          description,
          startDate,
          endDate,
          roomId,
          recurrenceId: recurrence ? recurrence.recurrenceId : null,
          statusId: 1,
          userId,
        },
        where: { eventId: eventId },
        update: {
          title,
          description,
          startDate,
          endDate,
          roomId,
          recurrenceId: recurrence ? recurrence.recurrenceId : null,
          statusId: 1,
          userId,
        },
        include: { room: true, recurrence: true },
      });

      if (!event) {
        InternalServerErrorMessage();
      }

      if (event.eventId === eventId) {
        return SuccessMessage("Updated Event", event);
      }

      return CreatedMessage("Created Event", event);
    }
  );
}

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    [
      { type: "permission", resource: "Event", action: "Read" },
      { type: "role", role: "Admin" },
    ],
    async () => {
      const searchParams = request.nextUrl.searchParams;

      const startDateParam = searchParams.get("startdate");
      const endDateParam = searchParams.get("enddate");
      const userId = searchParams.get("userId");

      if (!startDateParam || !endDateParam) {
        return BadRequestMessage();
      }

      const StartDate: UTCDate = new UTCDate(startDateParam);
      const EndDate: UTCDate = new UTCDate(endDateParam);

      const whereClause: import("@prisma/client").Prisma.EventWhereInput = {
        OR: [
          {
            startDate: { lte: EndDate },
            endDate: { gte: StartDate },
          },
          {
            recurrence: {
              startDate: { lte: EndDate },
              endDate: { gte: StartDate },
            },
          },
        ],
      };

      if (userId) {
        whereClause.AND = [{ userId: { equals: Number(userId) } }];
      }

      const events = await prisma.event.findMany({
        include: { room: true, recurrence: true },
        where: whereClause,
      });

      if (!events) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Events", events);
    }
  );
}
