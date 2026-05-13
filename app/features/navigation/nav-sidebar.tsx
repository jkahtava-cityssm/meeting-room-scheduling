'use client';

import * as React from 'react';

import { AtSign, Bug, Calendar, ChevronRight, CircleQuestionMark, Inbox, Info, LifeBuoy, NotebookPen, Send, Settings2 } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
} from '@/components/ui/sidebar';
import Link from 'next/link';
import DynamicIcon, { IconName } from '../../../components/ui/icon-dynamic';
import Image from 'next/image';

import { Sidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { navigateURL } from '@/lib/helpers';
import { Skeleton } from '../../../components/ui/skeleton';
import { useSession } from '@/contexts/SessionProvider';
import { useVerifySessionRequirement } from '@/lib/auth-client';

import { BadgeColored } from '../../../components/ui/badge-colored';
import { useTotalEventsByStatusQuery } from '@/lib/services/events';
import { endOfDay, format, parse, startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { GroupedPermissionRequirement } from '@/lib/auth-permission-checks';
import { useSearchParams } from 'next/navigation';
import { NavigationPermissions } from './permissions/navigation.permissions';
import { APP_FULL_URL } from '@/lib/api-helpers';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isPending } = useSession();

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

  return (
    <NavigationPermissions.Provider>
      <PrivateSidebar />
    </NavigationPermissions.Provider>
  );
}

function PrivateSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { can, canAny, isVerifying } = NavigationPermissions.usePermissions();

  const searchParams = useSearchParams();

  const dateParam = searchParams.get('selectedDate');

  const dateValue = useMemo(() => {
    return dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : null;
  }, [dateParam]);

  const viewDay = can('ViewCalendarDay');
  const viewMonth = can('ViewCalendarMonth');
  const viewWeek = can('ViewCalendarWeek');
  const viewYear = can('ViewCalendarYear');
  const viewAgenda = can('ViewCalendarAgenda');
  const viewStaffRequests = can('ViewStaffRequests');

  const hasCalendarAccess = canAny(viewDay, viewMonth, viewWeek, viewYear, viewAgenda, viewStaffRequests);

  const editPermissions = can('EditPermissions');
  const editRooms = can('EditRooms');
  const editConfiguration = can('EditConfiguration');
  const editUsers = can('EditUsers');

  const hasSettingsAccess = canAny(editPermissions, editRooms, editConfiguration, editUsers);

  const { data: pendingEvents, isPending: eventsPending } = useTotalEventsByStatusQuery('PENDING');

  return (
    <Sidebar className="z-50 top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SideBarHeaderGroup
        imagePath={`${APP_FULL_URL}/images/menu_logo.svg`}
        altText="An image of the crest and wreath of the city of Sault Ste. Marie"
        title="Room Scheduling/Booking"
        subtitle="The City of Sault Ste. Marie"
        url="/bookings/user-view"
      ></SideBarHeaderGroup>

      <SidebarContent>
        <SideBarGroup title="Application">
          <SideBarPrimaryMenuItem title={'Availability'} icon={<NotebookPen />} url={'/availability'} />
          <SideBarPrimaryMenuItem title={'My Bookings'} icon={<Send />} url={'/bookings/user-view'} />
          {hasCalendarAccess && (
            <SideBarCollapsibleGroup isOpenByDefault={true} title={'Calendar'} icon={<Calendar />}>
              {viewStaffRequests && (
                <SideBarSubMenuItem
                  title={'Requests'}
                  url={'/bookings/user-requests' + navigateURL(dateValue, 'year')}
                  iconName="circle-question-mark"
                  rightIndicator={<BadgeColored className=" ml-auto w-12">{pendingEvents ? pendingEvents.total : '-'}</BadgeColored>}
                />
              )}
              {viewAgenda && (
                <SideBarSubMenuItem title={'Agenda View'} url={'/calendar' + navigateURL(dateValue, 'agenda')} iconName="calendar-range" />
              )}
              {viewDay && <SideBarSubMenuItem title={'Day View'} url={'/calendar' + navigateURL(dateValue, 'day')} iconName="list" />}
              {viewWeek && <SideBarSubMenuItem title={'Week View'} url={'/calendar' + navigateURL(dateValue, 'week')} iconName="columns" />}
              {viewMonth && <SideBarSubMenuItem title={'Month View'} url={'/calendar' + navigateURL(dateValue, 'month')} iconName="grid-2x2" />}
              {viewYear && <SideBarSubMenuItem title={'Year View'} url={'/calendar' + navigateURL(dateValue, 'year')} iconName="grid-3x3" />}
            </SideBarCollapsibleGroup>
          )}
          {hasSettingsAccess && (
            <SideBarCollapsibleGroup isOpenByDefault={false} title={'Settings'} icon={<Settings2 />}>
              {editRooms && <SideBarSubMenuItem title={'Manage Rooms'} url={'/settings/manage-rooms'} />}
              {editPermissions && <SideBarSubMenuItem title={'Manage Permissions'} url={'/settings/manage-permissions'} />}
              {editConfiguration && <SideBarSubMenuItem title={'Manage Configuration'} url={'/settings/manage-configuration'} />}
              {editUsers && <SideBarSubMenuItem title={'Manage Users'} url={'/settings/manage-users'} />}
              {editConfiguration && <SideBarSubMenuItem title={'API Tests'} url={'/settings/manage-api'} />}
            </SideBarCollapsibleGroup>
          )}
        </SideBarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SideBarGroup title="">
          <SupportMenuItem title={'Support'} icon={<LifeBuoy />} />
          <AboutMenuItem title={'About'} icon={<Info />}></AboutMenuItem>
        </SideBarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

export function SideBarHeaderGroup({
  imagePath = `${APP_FULL_URL}/images/menu_logo.svg`,
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
  icon,
  isOpenByDefault,
  title,
  children,
}: {
  icon?: React.ReactNode;
  isOpenByDefault: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={isOpenByDefault} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title}>
            {icon}
            <span>{title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {children}
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function SideBarPrimaryMenuItem({ title, icon, url }: { title: string; icon?: React.ReactNode; url: string }) {
  return (
    <SidebarMenuButton asChild key={title} tooltip={title}>
      <Link href={url}>
        {icon}
        <span>{title}</span>
      </Link>
    </SidebarMenuButton>
  );
}

export function SupportMenuItem({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenuButton asChild key={title} tooltip={title}>
          <div>
            {icon}
            <span>{title}</span>
          </div>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="max-w-3xl min-w-fit min-h-fit">
        <DialogHeader>
          <DialogTitle>Book-A-Roo Support</DialogTitle>
          <DialogDescription>Have some questions or need help with something?</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2">
          <Alert>
            <CircleQuestionMark />
            <AlertTitle>Looking for a missing room?</AlertTitle>
            <AlertDescription>
              Availability and bookings for rooms that are directly managed by one department or division, like Engineering&apos;s Garden Room, should
              be inquired about by contacting the department or division directly.
            </AlertDescription>
          </Alert>
          <Alert>
            <Inbox />

            <AlertTitle>Alternative Booking Options</AlertTitle>
            <AlertDescription>
              <p>
                Phone:
                <a href="tel:17057592500">
                  <b>(705) 759-2500</b>
                </a>
              </p>
              <p>
                Email:
                <a href="mailto:MeetingRoomBookings@cityssm.on.ca">
                  <b>MeetingRoomBookings@cityssm.on.ca</b>
                </a>
              </p>
            </AlertDescription>
          </Alert>
          <Alert>
            <Bug />
            <AlertTitle>Error Reporting</AlertTitle>
            <AlertDescription>
              <a href="mailto:MeetingRoomBookings@cityssm.on.ca">
                <b>MeetingRoomBookings@cityssm.on.ca</b>
              </a>
              <p>
                Please provide as much information as you can regarding the error, knowing what page caused the problem and the activity you were
                trying to complete is very important!
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AboutMenuItem({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenuButton asChild key={title} tooltip={title}>
          <div>
            {icon}
            <span>{title}</span>
          </div>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="max-w-3xl min-w-fit min-h-fit">
        <DialogHeader>
          <DialogTitle>About Book-A-Roo</DialogTitle>
          <DialogDescription>A centralized meeting room booking system for the city of sault ste. marie</DialogDescription>
        </DialogHeader>
        <div className="flex flex-row">
          <div className="w-full p-2">
            <Image src={`/images/MeetingRoomBookingLogo.webp`} alt={'altText'} width={260} height={260}></Image>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Alert>
              <CircleQuestionMark />
              <AlertTitle>Looking for a missing room?</AlertTitle>
              <AlertDescription>
                Availability and bookings for rooms that are directly managed by one department or division, like Engineering&apos;s Garden Room,
                should be inquired about by contacting the department or division directly.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
