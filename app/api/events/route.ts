import { prisma } from "@/prisma";

import { NextRequest } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";
import { Prisma } from "@prisma/client";
import { createEvent, upsertEvent, updateEvent, findManyEvents, findFirstEvent } from "@/lib/data/events";
import { createRecurrence, upsertRecurrence, deleteRecurrence } from "@/lib/data/recurrence";
import { SEventPUT } from "@/lib/services/events";

export async function POST(request: NextRequest) {
	return guardRoute(
		request,
		{ CreateEvent: { type: "permission", resource: "Event", action: "Create" } },

		async ({ data, sessionUserId }) => {
			const { eventId, roomId, userId, statusId, title, description, startDate, endDate, recurrenceId, rule, ruleStartDate, ruleEndDate } = data;

			let recurrence = null;

			if (rule && ruleStartDate && ruleEndDate) {
				recurrence = await createRecurrence({
					data: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
				});
			}

			const event = await createEvent({
				title,
				description,
				startDate,
				endDate,
				room: { connect: { roomId } },
				...(recurrence && { recurrence: { connect: { recurrenceId: recurrence.recurrenceId } } }),
				status: { connect: { statusId: statusId } },
				...(userId && { user: { connect: { id: userId } } }),
				...(sessionUserId && { createdByUser: { connect: { id: sessionUserId } } }),
				...(sessionUserId && { updatedByUser: { connect: { id: sessionUserId } } }),
			});

			if (!event) {
				InternalServerErrorMessage();
			}

			return CreatedMessage("Created Event", event);
		},
		SEventPUT,
	);
}

export async function PUT(request: NextRequest) {
	return guardRoute(
		request,
		{
			UpdateEvent: { type: "permission", resource: "Event", action: "Update" },
		},
		async ({ sessionUserId, permissionCache, permissions, sessionId, data }) => {
			const {
				roomId,
				userId,
				statusId,
				title,
				description,
				startDate,
				endDate,
				recurrenceId,
				rule,
				ruleStartDate,
				ruleEndDate,
				eventRecipients,
				eventItems,
			} = data;

			const event = await prisma.$transaction(async tx => {
				let recurrence = null;

				if (rule && ruleStartDate && ruleEndDate) {
					recurrence = await upsertRecurrence(
						{
							create: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
							where: { recurrenceId: recurrenceId ?? -1 },
							update: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
						},
						tx,
					);
				} else if (recurrenceId) {
					await tx.recurrence.delete({ where: { recurrenceId } });
				}

				const event = await upsertEvent(
					{
						where: { eventId: data.eventId ?? -1 },
						create: {
							title,
							description,
							startDate,
							endDate,
							room: { connect: { roomId } },
							...(recurrence && { recurrence: { connect: { recurrenceId: recurrence.recurrenceId } } }),
							status: { connect: { statusId: statusId } },
							...(userId && { user: { connect: { id: userId } } }),
						},
						update: {
							title,
							description,
							startDate,
							endDate,
							room: { connect: { roomId } },
							status: { connect: { statusId } },
							recurrence: recurrence ? { connect: { recurrenceId: recurrence.recurrenceId } } : recurrenceId ? { disconnect: true } : undefined,
							...(userId && { user: { connect: { id: userId } } }),
						},
					},
					tx,
				);

				const eventId = event.eventId;
				if (eventRecipients) {
					await tx.eventRecipient.deleteMany({
						where: { eventId, eventRecipientId: { notIn: eventRecipients } },
					});

					await tx.eventRecipient.createMany({
						data: eventRecipients.map(eventRecipientId => ({ eventId, userId: eventRecipientId })),
						skipDuplicates: true,
					});
				}

				if (eventItems) {
					await tx.eventItem.deleteMany({
						where: { eventId, itemId: { notIn: eventItems } },
					});

					await tx.eventItem.createMany({
						data: eventItems.map(itemId => ({ eventId, itemId })),
						skipDuplicates: true,
					});
				}

				return await findFirstEvent({ eventId: eventId });
			});

			if (!event) {
				InternalServerErrorMessage();
			}

			if (event.eventId === data.eventId) {
				return SuccessMessage("Updated Event", event);
			}

			return CreatedMessage("Created Event", event);
		},
		SEventPUT,
	);
}

export async function PATCH(request: NextRequest) {
	return guardRoute(
		request,
		{
			UpdateEvent: { type: "permission", resource: "Event", action: "Update" },
		},
		async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
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
				recurrence = await upsertRecurrence({
					create: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
					where: { recurrenceId: recurrenceId || 0 },
					update: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
				});
				updateData.recurrence = { connect: { recurrenceId: recurrence.recurrenceId } };
			}

			if (ruleData === null && recurrenceId !== null) {
				await deleteRecurrence({ where: { recurrenceId } });
				updateData.recurrence = { disconnect: true };
			}

			if (Object.keys(updateData).length === 0) {
				return BadRequestMessage("No fields provided for update");
			}

			const event = await updateEvent({
				where: { eventId },
				data: updateData,
			});

			if (!event) {
				return InternalServerErrorMessage();
			}

			return SuccessMessage("Event updated successfully", event);
		},
	);
}

export async function GET(request: NextRequest) {
	return guardRoute(
		request,
		{ ReadEvent: { type: "permission", resource: "Event", action: "Read All" } },

		async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
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
				whereClause.AND = [{ userId: { equals: Number(sessionUserId) } }];
			}

			const events = await findManyEvents(whereClause);

			if (!events) {
				return InternalServerErrorMessage();
			}

			return SuccessMessage("Collected Events", events);
		},
	);
}
