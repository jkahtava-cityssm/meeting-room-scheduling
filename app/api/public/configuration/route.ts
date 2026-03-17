import { prisma } from "@/prisma";
import { findManyConfiguration, SConfigurationEntry } from "@/lib/data/configuration";

import { NextRequest } from "next/server";
import {
  InternalServerErrorMessage,
  SuccessMessage,
  UnauthorizedMessage,
  validateVisibleHours,
} from "@/lib/api-helpers";
import { verifySecretHeader } from "@/lib/server/verifySecretHeader";
import { TConfigurationKeys } from "@/lib/types";
import z from "zod/v4";

export async function GET(request: NextRequest) {
  if (!verifySecretHeader(request)) {
    return UnauthorizedMessage();
  }

  const configEntries = await findManyConfiguration([
    "visibleHoursStart",
    "visibleHoursEnd",
    "timeSlotInterval",
    "maxBookingSpan",
  ]);

  //console.log(z.array(SConfigurationEntry).safeParse(configEntries));

  const flatMap = configEntries.reduce<Partial<Record<TConfigurationKeys, string>>>((acc, entry) => {
    const key = entry.key as TConfigurationKeys;
    acc[key] = String(entry.value);
    return acc;
  }, {});

  //const { visibleHoursStart, visibleHoursEnd } = validateVisibleHours(Number(flatMap.visibleHoursStart), Number(flatMap.visibleHoursEnd));

  return SuccessMessage("Collected Public Configuration", {
    hours: { from: Number(flatMap.visibleHoursStart), to: Number(flatMap.visibleHoursEnd) },
    useSSO: flatMap.singleSignOnEnabled === "true",
    interval: Number(flatMap.timeSlotInterval),
  });
}
