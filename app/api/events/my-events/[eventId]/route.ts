import { findManyEvents, deleteManyEvents, findFirstEvent } from "@/lib/data/events";
import { BadRequestMessage, DeleteMessage, InternalServerErrorMessage, SuccessMessage, UnauthorizedMessage } from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
	return guardRoute(
		request,
		{
			AnyOf: [
				{ hasReadAll: { type: "permission", resource: "Event", action: "Read All" } },
				{ hasReadSelf: { type: "permission", resource: "Event", action: "Read Self" } },
			],
		},
		async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
			const { eventId } = await params;
			if (!eventId || isNaN(Number(eventId))) {
				return BadRequestMessage();
			}

			const event = await findFirstEvent({ eventId: parseInt(eventId) });

			if (!event) {
				return InternalServerErrorMessage();
			}

			if (permissions.hasReadAll || event.userId === Number(sessionUserId)) {
				return SuccessMessage("Collected Event", event);
			}

			return UnauthorizedMessage();
		},
	);
}
