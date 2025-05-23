"use client";

import * as React from "react";

import Image from "next/image";

import { Calendar, Bot, Command, Frame, LifeBuoy, Map, PieChart, Send, Settings2, SquareTerminal } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

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
          url: "/private/bookings/user-view",
        },
        {
          title: "Pending Requests",
          url: "/private/bookings/user-view",
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
          url: "/private/calendar/agenda-view",
        },
        {
          title: "Calendar - Day",
          url: "/private/calendar/day-view",
        },
        {
          title: "Calendar - Week",
          url: "/private/calendar/week-view",
        },
        {
          title: "Calendar - Month",
          url: "/private/calendar/month-view",
        },
        {
          title: "Calendar - Year",
          url: "/private/calendar/year-view",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Add Room",
          url: "#",
        },
        {
          title: "Add User",
          url: "#",
        },
        {
          title: "Manage Permissions",
          url: "#",
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
  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/private">
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
