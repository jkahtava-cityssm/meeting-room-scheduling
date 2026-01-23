import { prisma } from "@/prisma";
import { findManyConfiguration } from "@/lib/data/configuration";

import { NextRequest } from "next/server";
import { InternalServerErrorMessage, SuccessMessage, validateVisibleHours } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
	const configEntries = await findManyConfiguration(["visibleHoursStart", "visibleHoursEnd", "singleSignOnEnabled", "timeSlotIntervalMinutes"]);

	const { visibleHoursStart, visibleHoursEnd } = validateVisibleHours(Number(configEntries.visibleHoursStart), Number(configEntries.visibleHoursEnd));

	return SuccessMessage("Collected Public Configuration", {
		hours: { from: visibleHoursStart, to: visibleHoursEnd },
		useSSO: configEntries.singleSignOnEnabled,
		interval: Number(configEntries.timeSlotIntervalMinutes),
	});
}
