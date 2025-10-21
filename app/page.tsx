import React from "react";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeButton } from "@/components/theme-button";
import { PublicHeader } from "@/components/public-header";
import { CalendarPublicView } from "@/components/calendar/calendar-public-view";
import { CalendarProvider } from "@/contexts/CalendarProvider";

export default async function Home() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <PublicHeader
        left={
          <Image
            src="/images/city-shield-wreath-cmyk.svg"
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
          <CalendarProvider>
            <CalendarPublicView></CalendarPublicView>
          </CalendarProvider>
        </div>
      </PublicHeader>
    </div>
  );
}
