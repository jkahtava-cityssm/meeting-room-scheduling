export const dynamic = "force-dynamic";

import { ConfigurationPage } from "@/app/features/system-configuration/configuration-table";
import { RegisterSSO } from "@/app/features/system-configuration/single-sign-on";
import { findManyConfiguration } from "@/lib/data/configuration";

export default async function ManageConfiguration() {
  const configEntries = await findManyConfiguration([
    "singleSignOnEnabled",
    "visibleHoursStart",
    "visibleHoursEnd",
    "timeSlotIntervalMinutes",
    "defaultUserRole",
  ]);
  const useSSO = configEntries.singleSignOnEnabled === "true";

  return (
    <div className="overflow-hidden rounded-xl border min-w-92">
      <div className="flex flex-col items-center gap-2 m-4">
        <ConfigurationPage></ConfigurationPage>
      </div>
    </div>
  );
}
