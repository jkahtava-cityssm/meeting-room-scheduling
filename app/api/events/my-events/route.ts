import { prisma } from "@/prisma";

import { NextRequest } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";
import { findManyEvents } from "@/lib/data/events";
import { TColors, TStatusKey } from "@/lib/types";
import { isGroupRequirementMet } from "@/lib/auth-permission-checks";

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { ReadEvent: { type: "permission", resource: "Event", action: "Read Self" } },

    async (userId, roles) => {
      const searchParams = request.nextUrl.searchParams;

      const startDateParam = searchParams.get("startdate");
      const endDateParam = searchParams.get("enddate");
      const hasUserId = searchParams.get("userId");

      if (!startDateParam || !endDateParam || !hasUserId) {
        return BadRequestMessage();
      }

      const StartDate: UTCDate = new UTCDate(startDateParam);
      const EndDate: UTCDate = new UTCDate(endDateParam);

      const whereClause: import("@prisma/client").Prisma.EventWhereInput = {
        AND: [
          {
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
          },
          {
            OR: [
              { userId: { equals: Number(userId) } },
              {
                AND: [
                  { userId: { not: Number(userId) } },
                  { OR: [{ status: { key: "APPROVED" as TStatusKey } }, { status: { key: "PENDING" as TStatusKey } }] },
                ],
              },
            ],
          },
        ],
      };

      const events = await findManyEvents(whereClause);

      const permission = await isGroupRequirementMet(roles, {
        hasReadAll: { type: "permission", resource: "Event", action: "Read All" },
        hasReadSelf: { type: "permission", resource: "Event", action: "Read Self" },
      });

      const processedData = events.map((event) => {
        // 1. If I own it, return the whole thing
        if (event.userId === userId) {
          return event;
        }
        return {
          ...event, // Keep IDs, Dates, and Room/Status structures
          title: permission.hasReadAll ? event.title : event.status?.key === "APPROVED" ? "Booked" : "Requested",
          description: permission.hasReadAll ? event.description : "",
          userId: permission.hasReadAll ? event.userId : null,
          room: { ...event.room, color: event.status?.key === "APPROVED" ? "approved" : ("disabled" as TColors) },
        };
      });

      if (!processedData) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Events", processedData);
    },
  );
}
