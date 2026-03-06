"use client";

import { CalendarPublicView } from "@/app/features/calendar/view-public/public-view";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarProviderPublic } from "@/contexts/CalendarProviderPublic";
import { LoaderCircle } from "lucide-react";

import { Suspense } from "react";

export default function Availability() {
  return (
    <CalendarProviderPublic>
      <CalendarPublicView></CalendarPublicView>
    </CalendarProviderPublic>
  );
}
