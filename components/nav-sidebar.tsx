"use client";

import * as React from "react";

import { ChevronRight } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import DynamicIcon, { IconName } from "./ui/icon-dynamic";
import Image from "next/image";

import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { navigateURL } from "@/lib/helpers";
import { Skeleton } from "./ui/skeleton";
import { useClientSession } from "@/hooks/use-client-auth";
import { useVerifySessionRequirement } from "@/lib/auth-client";

import { BadgeColored } from "./ui/badge-colored";
import { useTotalEventsByStatusQuery } from "@/services/events";
import { endOfDay, format, parse, startOfDay } from "date-fns";
import { useMemo } from "react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { session, isPending } = useClientSession();
  const ReadCalendar = useVerifySessionRequirement(session, {
    type: "permission",
    resource: "ReservationCalendar",
    action: "Read",
  });

  const today = format(new Date(), "yyyy-MM-dd");

  const { startDate, endDate } = useMemo(() => {
    const parsedDate = parse(today, "yyyy-MM-dd", new Date());
    const startDate = startOfDay(parsedDate);
    const endDate = endOfDay(parsedDate);
    return { startDate, endDate };
  }, [today]);
  const { data: pendingEvents, isPending: eventsPending } = useTotalEventsByStatusQuery("1");

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
      <SideBarHeaderGroup
        imagePath="/images/menu_logo.svg"
        altText="An image of the crest and wreath of the city of Sault Ste. Marie"
        title="Room Scheduling/Booking"
        subtitle="The City of Sault Ste. Marie"
        url="/bookings/user-view"
      ></SideBarHeaderGroup>

      <SidebarContent>
        <SideBarGroup title="Application">
          <SideBarPrimaryMenuItem title={"Availability"} iconName={"notebook-pen"} url={"/availability"} />
          <SideBarPrimaryMenuItem title={"My Bookings"} iconName={"send"} url={"/bookings/user-view"} />
          {ReadCalendar && (
            <SideBarCollapsibleGroup isOpenByDefault={true} title={"Calendar"} iconName="calendar">
              <SideBarSubMenuItem
                title={"Staff Requests"}
                url={"/bookings/user-requests"}
                iconName="circle-question-mark"
                rightIndicator={
                  <BadgeColored className=" ml-auto w-12">{pendingEvents ? pendingEvents.total : "-"}</BadgeColored>
                }
              />
              <SideBarSubMenuItem
                title={"Agenda View"}
                url={"/calendar" + navigateURL(null, "agenda")}
                iconName="calendar-range"
              />
              <SideBarSubMenuItem title={"Day View"} url={"/calendar" + navigateURL(null, "day")} iconName="list" />
              <SideBarSubMenuItem
                title={"Week View"}
                url={"/calendar" + navigateURL(null, "week")}
                iconName="columns"
              />
              <SideBarSubMenuItem
                title={"Month View"}
                url={"/calendar" + navigateURL(null, "month")}
                iconName="grid-2x2"
              />
              <SideBarSubMenuItem
                title={"Year View"}
                url={"/calendar" + navigateURL(null, "year")}
                iconName="grid-3x3"
              />
            </SideBarCollapsibleGroup>
          )}
          <SideBarCollapsibleGroup isOpenByDefault={false} title={"Settings"} iconName="settings-2">
            <SideBarSubMenuItem title={"Manage Rooms"} url={"/settings/manage-rooms"} />
            <SideBarSubMenuItem title={"Manage Permissions"} url={"/settings/manage-permissions"} />
          </SideBarCollapsibleGroup>
        </SideBarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SideBarGroup title="">
          <SideBarPrimaryMenuItem title={"Support"} iconName={"life-buoy"} url={"#"} />
        </SideBarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

export function SideBarHeaderGroup({
  imagePath = "/images/menu_logo.svg",
  altText,
  title,
  subtitle,
  url,
}: {
  imagePath?: string;
  altText: string;
  title: string;
  subtitle: string;
  url: string;
}) {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href={url}>
              <div className="flex aspect-square size-8 items-center justify-center">
                <Image src={imagePath} alt={altText} width={32} height={32} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{title}</span>
                <span className="cenet text-xs">{subtitle}</span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

export function SideBarGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>{children}</SidebarMenu>
    </SidebarGroup>
  );
}

export function SideBarCollapsibleGroup({
  iconName,
  isOpenByDefault,
  title,
  children,
}: {
  iconName?: IconName;
  isOpenByDefault: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={isOpenByDefault} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title}>
            {iconName && <DynamicIcon name={iconName} />}
            <span>{title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {children}
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function SideBarPrimaryMenuItem({ title, iconName, url }: { title: string; iconName?: IconName; url: string }) {
  return (
    <SidebarMenuButton asChild key={title} tooltip={title}>
      <Link href={url}>
        {iconName && <DynamicIcon name={iconName} />}
        <span>{title}</span>
      </Link>
    </SidebarMenuButton>
  );
}

export function SideBarSubMenuItem({
  title,
  iconName,
  url,
  rightIndicator,
}: {
  title: string;
  iconName?: IconName;
  url: string;
  rightIndicator?: React.ReactNode;
}) {
  return (
    <CollapsibleContent>
      <SidebarMenuSub>
        <SidebarMenuSubItem key={title}>
          <SidebarMenuSubButton asChild>
            <Link href={url}>
              {iconName && <DynamicIcon name={iconName} />}
              <span>{title}</span>
              {rightIndicator}
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      </SidebarMenuSub>
    </CollapsibleContent>
  );
}
