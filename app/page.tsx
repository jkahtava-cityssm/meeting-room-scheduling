import React, { Suspense } from "react";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeButton } from "@/components/theme-button";
import { PublicHeader } from "@/components/public-header";

import { CalendarProvider } from "@/contexts/CalendarProvider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarPublicView } from "./features/calendar/view-public/calendar-public-view";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/availability");
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <PublicHeader
        left={
          <Image
            src="/images/login_logo.svg"
            alt="An image of the crest and wreath of the city of Sault Ste. Marie"
            width={32}
            height={32}
            style={{ width: "32px", height: "32px" }}
            priority={true}
          />
        }
        right={
          <div className="flex gap-2">
            <ThemeButton />
            <Button>
              <Link href={"/login"}>Sign In</Link>
            </Button>
          </div>
        }
        title="Meeting Room Availability"
      >
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Suspense fallback={<>...Loading</>}>
            <CalendarProvider>
              <CalendarPublicView></CalendarPublicView>
            </CalendarProvider>
          </Suspense>
        </div>
      </PublicHeader>
    </div>
  );
}
