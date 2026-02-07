import { prisma } from "@/prisma";
import { findManyConfiguration } from "@/lib/data/configuration";

import { NextRequest } from "next/server";
import { InternalServerErrorMessage, SuccessMessage, UnauthorizedMessage, validateVisibleHours } from "@/lib/api-helpers";
import { verifySecretHeader } from "@/lib/server/verifySecretHeader";

export async function GET(request: NextRequest) {
	if (!verifySecretHeader(request)) {
		return UnauthorizedMessage();
	}

	const configEntries = await findManyConfiguration(["visibleHoursStart", "visibleHoursEnd", "singleSignOnEnabled", "timeSlotIntervalMinutes"]);

	const { visibleHoursStart, visibleHoursEnd } = validateVisibleHours(Number(configEntries.visibleHoursStart), Number(configEntries.visibleHoursEnd));

	return SuccessMessage("Collected Public Configuration", {
		hours: { from: visibleHoursStart, to: visibleHoursEnd },
		useSSO: configEntries.singleSignOnEnabled,
		interval: Number(configEntries.timeSlotIntervalMinutes),
	});
}
