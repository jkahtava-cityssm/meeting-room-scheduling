"use client";

import * as React from "react";

import Image from "next/image";

import { Calendar, LifeBuoy, Send, Settings2 } from "lucide-react";

import { NavMain } from "@/components/nav-sidebar-contents";
import { NavSecondary } from "@/components/nav-sidebar-footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { navigateURL } from "@/lib/helpers";
import { Skeleton } from "./ui/skeleton";
import { useClientSession } from "@/hooks/use-client-auth";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    image: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Bookings",
      url: "#",
      icon: Send,
      isActive: true,
      items: [
        {
          title: "My Bookings",
          url: "/bookings/user-view",
        },
        {
          title: "Pending Requests",
          url: "/bookings/user-requests",
        },
      ],
    },
    {
      title: "View Calendar",
      url: "#",
      icon: Calendar,
      isActive: true,
      items: [
        {
          title: "Calendar - Daily Agenda",
          url: "/calendar" + navigateURL(null, "agenda"),
        },
        {
          title: "Calendar - Day",
          url: "/calendar" + navigateURL(null, "day"),
        },
        {
          title: "Calendar - Week",
          url: "/calendar" + navigateURL(null, "week"),
        },
        {
          title: "Calendar - Month",
          url: "/calendar" + navigateURL(null, "month"),
        },
        {
          title: "Calendar - Year",
          url: "/calendar" + navigateURL(null, "year"),
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Manage Rooms",
          url: "/settings/manage-rooms",
        },
        {
          title: "Manage Permissions",
          url: "/settings/manage-permissions",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session, isPending } = useClientSession();
  //32
  //48 total + 8 = 64
  //255
  if (isPending) {
    return (
      <div className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
        <div className="flex flex-col bg-sidebar border-r h-full w-full ">
          <div className="flex min-h-0 flex-1 flex-col ">
            <div className="flex flex-col gap-2 p-2 h-16 w-64">
              <Skeleton className="h-full"></Skeleton>
            </div>
            <div className="relative flex w-full min-w-0 flex-col p-2">
              <div className="pr-2 py-2">
                <Skeleton className="h-4" />
              </div>

              <div className="pr-2 mb-1">
                <Skeleton className="h-8" />
              </div>
              <div className="flex flex-col px-2.5 py-0.5 mx-3.5 border-l gap-1">
                <Skeleton className="h-7" />
                <Skeleton className="h-7" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-2 h-16 w-64">
            <Skeleton className="h-full "></Skeleton>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    //console.log("No session, redirecting to login");
  }

  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/bookings/user-view">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src="/images/city-shield-wreath-cmyk.svg"
                    alt="An image of the crest and wreath of the city of Sault Ste. Marie"
                    width={32}
                    height={32}
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Room Scheduling/Booking</span>
                  <span className="cenet text-xs">The City of Sault Ste. Marie</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarFooter>
    </Sidebar>
  );
}
