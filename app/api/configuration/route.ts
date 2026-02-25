import { NextRequest } from "next/server";
import { findManyConfiguration } from "@/lib/data/configuration";
import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";
import { CONFIGURATION_KEYS, TConfigurationKeys } from "@/lib/types";

function parseRequestedKeys(request: NextRequest): readonly TConfigurationKeys[] {
  const url = new URL(request.url);
  const keysParams = url.searchParams.getAll("keys");

  // If no keys provided, return all
  if (keysParams.length === 0) {
    return CONFIGURATION_KEYS;
  }

  // Filter invalid values and narrow to TConfigurationKeys
  const valid = keysParams.filter((k): k is TConfigurationKeys =>
    (CONFIGURATION_KEYS as readonly string[]).includes(k),
  );

  // If after filtering there are none, default to all
  return valid.length > 0 ? valid : CONFIGURATION_KEYS;
}

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { EditConfiguration: { type: "permission", resource: "Settings", action: "Edit Configuration" } },
    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const requestedKeys = parseRequestedKeys(request);

      const configEntries = await findManyConfiguration(requestedKeys);

      if (!configEntries) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Configuration", configEntries);
    },
  );
}
