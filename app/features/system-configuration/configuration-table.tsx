"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useConfigurationQuery } from "@/lib/services/configuration";
import { RegisterSSO } from "./single-sign-on";

export function ConfigurationPage() {
  const { data } = useConfigurationQuery(["timeSlotIntervalMinutes", "visibleHoursStart", "visibleHoursEnd"]);

  const isLoading = false;

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="hidden md:flex h-full">
        <div className="flex border-r overflow-auto"></div>
        <div className="flex-1 overflow-auto">
          <RegisterSSO isDisabled={false} />
        </div>
      </div>
    </div>
  );
}
