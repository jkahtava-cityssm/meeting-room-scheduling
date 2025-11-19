import { prisma } from "@/prisma";

import { NextRequest } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    { type: "permission", resource: "Event", action: "Create" },

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
    {
      type: "or",
      requirements: [
        { type: "role", role: "Admin" },
        { type: "permission", resource: "Event", action: "Update" },
      ],
    },
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

export async function PATCH(request: NextRequest) {
  return guardRoute(
    request,
    {
      type: "or",
      requirements: [
        { type: "role", role: "Admin" },
        { type: "permission", resource: "Event", action: "Update" },
      ],
    },
    async () => {
      const { eventData, ruleData } = await request.json();

      if (!eventData || !eventData.eventId) {
        return BadRequestMessage("Missing eventId for update");
      }

      const { eventId, title, description, startDate, endDate, roomId, recurrenceId, userId, status } = eventData;
      const { rule, ruleStartDate, ruleEndDate } = ruleData || {};

      // Build dynamic update object
      const updateData: Prisma.EventUpdateInput = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (startDate !== undefined) updateData.startDate = startDate;
      if (endDate !== undefined) updateData.endDate = endDate;
      if (roomId !== undefined) updateData.room = { connect: { roomId } };
      if (userId !== undefined) updateData.user = { connect: { id: userId } };
      if (status !== undefined) updateData.status = status;

      let recurrence = null;

      if (rule) {
        recurrence = await prisma.recurrence.upsert({
          create: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
          where: { recurrenceId: recurrenceId || 0 },
          update: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
        });
        updateData.recurrence = { connect: { recurrenceId: recurrence.recurrenceId } };
      }

      if (ruleData === null && recurrenceId !== null) {
        await prisma.recurrence.delete({ where: { recurrenceId } });
        updateData.recurrence = { disconnect: true };
      }

      if (Object.keys(updateData).length === 0) {
        return BadRequestMessage("No fields provided for update");
      }

      const event = await prisma.event.update({
        where: { eventId },
        data: updateData,
        include: { room: true, recurrence: true },
      });

      if (!event) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Event updated successfully", event);
    }
  );
}

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { type: "permission", resource: "Event", action: "Read" },

    async (userId, roles) => {
      const searchParams = request.nextUrl.searchParams;

      const startDateParam = searchParams.get("startdate");
      const endDateParam = searchParams.get("enddate");
      const hasUserId = searchParams.get("userId");

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

      if (hasUserId) {
        whereClause.AND = [{ userId: { equals: Number(userId) } }];
      }

      const events = await prisma.event.findMany({
        include: { room: { include: { roomScope: true, roomCategory: true, roomProperty: true } }, recurrence: true },
        where: whereClause,
      });

      if (!events) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Events", events);
    }
  );
}
