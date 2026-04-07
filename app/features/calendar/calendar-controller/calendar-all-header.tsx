'use client';
import Link from 'next/link';
import {
  Columns,
  Grid3x3,
  List,
  Plus,
  Grid2x2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  LucideFilter,
  LucideSearch,
  LucideMenuSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoomSelect } from '@/app/features/rooms/room-select';

import type { TCalendarView, TStatusKey } from '@/lib/types';
import { navigateDate, navigateURL } from '@/lib/helpers';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';
import { useRouter } from 'next/navigation';

import { DateNavigator, NavigationButtons } from './calendar-all-header-date-navigator';
import { TodayButton } from './calendar-all-header-today-button';
import { CalendarPermissions } from '../permissions/calendar.permissions';

import EventDrawer from '../../event-drawer/drawer-root';
import { useSharedEventDrawer } from '../../event-drawer/drawer-context';

import { StatusMultiSelect } from '../../status/status-multiselect';
import { RoomMultiSelect } from '../../rooms/room-multiselect';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DateControls } from '../view-public/public-date-control';
import { useState } from 'react';
import { CalendarDayPopover } from '@/components/calendar-day-popover/calendar-day-popover';
import { formatDate } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RoomMobileSelector } from './room-mobile-filter';

export function CalendarHeader({
  view,
  selectedDate,
  userId,
  permissions,
}: {
  view: Exclude<TCalendarView, 'all' | 'public'>;
  selectedDate: Date;
  userId?: string;
  permissions: Record<Exclude<TCalendarView, 'all' | 'public'>, boolean>;
}) {
  const { day, week, month, year, agenda } = permissions;

  const { openEventDrawer } = useSharedEventDrawer();
  const { can, isVerifying } = CalendarPermissions.usePermissions();
  const { setSelectedRoomIds, selectedRoomIds, setSelectedStatusKeys, selectedStatusKeys } = usePrivateCalendar();
  const { push } = useRouter();

  const handleNavigatePrevious = () => {
    const previousDate = navigateDate(selectedDate, view, 'previous');

    push(navigateURL(previousDate, view));
  };

  const handleNavigateNext = () => {
    const nextDate = navigateDate(selectedDate, view, 'next');

    push(navigateURL(nextDate, view));
  };

  const handleNavigateRoomChange = (roomIds: string[]) => {
    setSelectedRoomIds(roomIds);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:border-b p-4 min-w-90 lg:flex-row lg:items-end lg:justify-between shrink-0">
        <MobileHeader
          permissions={permissions}
          view={view}
          selectedDate={selectedDate}
          className="flex sm:hidden"
          selectedStatusKeys={selectedStatusKeys}
          setSelectedStatusKeys={setSelectedStatusKeys}
          selectedRoomIds={selectedRoomIds}
          setSelectedRoomIds={setSelectedRoomIds}
        />
        <div className="flex border-b sm:hidden items-center gap-3">
          <MobileDateControls
            selectedDate={selectedDate}
            view={view}
            onPreviousClick={handleNavigatePrevious}
            onNextClick={handleNavigateNext}
          ></MobileDateControls>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <TodayButton view={view} />

          <DateNavigator view={view} selectedDate={selectedDate} onPreviousClick={handleNavigatePrevious} onNextClick={handleNavigateNext} />
        </div>

        <div className="hidden items-center gap-1.5  sm:flex sm:flex-row lg:justify-between lg:ml-auto ">
          <div className="w-full sm:w-1/2 flex flex-col flex-1 gap-1">
            <Label>Status</Label>
            <StatusMultiSelect
              selectedStatusKeys={selectedStatusKeys}
              onChange={(values) => setSelectedStatusKeys(values as TStatusKey[])}
              excludeStatusKeys={[]}
              isDisabled={false}
              className="min-w-60 lg:w-60"
            />
          </div>
          <div className="w-full sm:w-1/2 flex flex-col flex-1 gap-1">
            <Label>Rooms</Label>
            <RoomMultiSelect
              hideSelectAll={false}
              selectedRoomIds={selectedRoomIds}
              onChange={(values) => handleNavigateRoomChange(values)}
              excludeRoomIds={[]}
              isDisabled={false}
              className="min-w-60 lg:w-60"
            />
          </div>
        </div>

        <div className="hidden sm:flex sm:gap-4 sm:flex-row sm:justify-between ">
          <div className="flex flex-col w-full items-center gap-1.5">
            <div className="inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
              <ViewButton
                hasPermission={day}
                label="View by day"
                selectedDate={selectedDate}
                currentView={view}
                triggerView={'day'}
                icon={<List strokeWidth={1.8} />}
                isFirstButton
              />
              <ViewButton
                hasPermission={week}
                label="View by week"
                selectedDate={selectedDate}
                currentView={view}
                triggerView={'week'}
                icon={<Columns strokeWidth={1.8} />}
              />
              <ViewButton
                hasPermission={month}
                label="View by month"
                selectedDate={selectedDate}
                currentView={view}
                triggerView={'month'}
                icon={<Grid2x2 strokeWidth={1.8} />}
              />
              <ViewButton
                hasPermission={year}
                label="View by year"
                selectedDate={selectedDate}
                currentView={view}
                triggerView={'year'}
                icon={<Grid3x3 strokeWidth={1.8} />}
              />
              <ViewButton
                hasPermission={agenda}
                label="View by agenda"
                selectedDate={selectedDate}
                currentView={view}
                triggerView={'agenda'}
                icon={<CalendarRange strokeWidth={1.8} />}
                isLastButton
              />
            </div>
          </div>

          {!isVerifying && can('CreateEvent') && (
            <Button className="w-full sm:w-auto" onClick={() => openEventDrawer({ userId: userId, creationDate: new Date() })}>
              <Plus />
              Add Event
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/*
const MobileHeader = ({
  selectedDate,
  permissions,
  view,
  className,
}: {
  permissions: Record<Exclude<TCalendarView, 'all' | 'public'>, boolean>;
  selectedDate: Date;
  view: Exclude<TCalendarView, 'all' | 'public'>;
  className?: string;
}) => {
  const { day, week, month, year, agenda } = permissions;
  return (
    <div className={cn('flex items-center gap-2 justify-between', className)}>
      <span className="text-lg font-semibold w-35">
        {formatDate(selectedDate, 'MMMM')} {selectedDate.getFullYear()}
      </span>
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="px-2">
              <LucideMenuSquare className="size-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <RadioGroup defaultValue={view} value={view} className="gap-4">
              <ConditionalLink
                href={navigateURL(selectedDate, 'day')}
                isDisabled={!day}
                id={'day'}
                value={'day'}
                label={'Day'}
                icon={<List className="size-4" />}
              ></ConditionalLink>
              <ConditionalLink
                href={navigateURL(selectedDate, 'week')}
                isDisabled={!week}
                id={'week'}
                value={'week'}
                label={'Week'}
                icon={<Columns className="size-4" />}
              ></ConditionalLink>
              <ConditionalLink
                href={navigateURL(selectedDate, 'month')}
                isDisabled={!month}
                id={'month'}
                value={'month'}
                label={'Month'}
                icon={<Grid2x2 className="size-4" />}
              ></ConditionalLink>
              <ConditionalLink
                href={navigateURL(selectedDate, 'year')}
                isDisabled={!year}
                id={'year'}
                value={'year'}
                label={'Year'}
                icon={<Grid3x3 className="size-4" />}
              ></ConditionalLink>

              <ConditionalLink
                href={navigateURL(selectedDate, 'agenda')}
                isDisabled={!agenda}
                id={'agenda'}
                value={'agenda'}
                label={'Agenda'}
                icon={<CalendarRange className="size-4" />}
              ></ConditionalLink>
            </RadioGroup>
          </PopoverContent>
        </Popover>

        <Button size="sm" variant="ghost" className="px-2">
          <LucideFilter className="size-6" />
        </Button>
      </div>
    </div>
  );
};*/

const MobileHeader = ({
  selectedDate,
  permissions,
  view,
  className,
  selectedStatusKeys,
  setSelectedStatusKeys,
  selectedRoomIds,
  setSelectedRoomIds,
}: {
  permissions: Record<Exclude<TCalendarView, 'all' | 'public'>, boolean>;
  selectedDate: Date;
  view: Exclude<TCalendarView, 'all' | 'public'>;
  className?: string;
  selectedStatusKeys: TStatusKey[];
  setSelectedStatusKeys: (values: TStatusKey[]) => void;
  selectedRoomIds: string[];
  setSelectedRoomIds: (values: string[]) => void;
}) => {
  const { day, week, month, year, agenda } = permissions;
  const [activeTab, setActiveTab] = useState<'main' | 'rooms' | 'status'>('main');
  return (
    <div className={cn('flex items-center gap-2 justify-between', className)}>
      <div className={cn('flex items-center justify-between p-2 w-full', className)}>
        {/* LEFT: Primary Action */}
        <Button size="sm" className=" px-4 h-9 shadow-sm">
          <Plus className="mr-1.5 size-4" />
          <span className="font-semibold">Add Event</span>
        </Button>

        {/* RIGHT: Configuration Group */}
        <div className="flex items-center gap-1.5">
          {/* VIEW & NAVIGATION DRAWER */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <LucideMenuSquare className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[20px] px-6 pb-8">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left">Calendar View</SheetTitle>
              </SheetHeader>

              <RadioGroup value={view} className="gap-2">
                {[
                  { id: 'day', label: 'Day', icon: <List className="size-5" />, active: day },
                  { id: 'week', label: 'Week', icon: <Columns className="size-5" />, active: week },
                  { id: 'month', label: 'Month', icon: <Grid2x2 className="size-5" />, active: month },
                  { id: 'year', label: 'Year', icon: <Grid3x3 className="size-5" />, active: year },
                  { id: 'agenda', label: 'Agenda', icon: <CalendarRange className="size-5" />, active: agenda },
                ].map((item) => (
                  <MobileViewOption
                    key={item.id}
                    id={item.id}
                    href={navigateURL(selectedDate, item.id as TCalendarView)}
                    icon={item.icon}
                    label={item.label}
                    value={item.id}
                    isDisabled={!item.active}
                  />
                ))}
              </RadioGroup>
            </SheetContent>
          </Sheet>

          {/* FILTER DRAWER (Placeholder for your MultiSelects) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <LucideFilter className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] px-6 flex flex-col">
              {activeTab === 'main' ? (
                <div className="space-y-6 py-4">
                  <SheetHeader className="text-left">
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>

                  <div className="grid gap-3">
                    <FilterSummaryButton label="Status" count={selectedStatusKeys.length} onClick={() => setActiveTab('status')} />
                    <FilterSummaryButton label="Rooms" count={selectedRoomIds.length} onClick={() => setActiveTab('rooms')} />
                  </div>

                  <div className="pt-4 border-t">
                    <SheetClose asChild>
                      <Button className="w-full h-12 text-base font-semibold">Apply Filters</Button>
                    </SheetClose>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full overflow-hidden space-y-6 py-4">
                  <Button variant="ghost" className="w-fit -ml-2 mb-2 gap-2" onClick={() => setActiveTab('main')}>
                    <ChevronLeft className="size-4" /> Back to Filters
                  </Button>

                  {activeTab === 'status' && <RoomMobileSelector selectedRoomIds={selectedRoomIds} onChange={setSelectedRoomIds} />}

                  {activeTab === 'rooms' && <RoomMobileSelector selectedRoomIds={selectedRoomIds} onChange={setSelectedRoomIds} />}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

const ViewButton = ({
  currentView,
  triggerView,
  label,
  hasPermission,
  selectedDate,
  isFirstButton = false,
  isLastButton = false,
  icon,
}: {
  currentView: TCalendarView;
  triggerView: TCalendarView;
  label: string;
  hasPermission: boolean;
  selectedDate: Date;
  isFirstButton?: boolean;
  isLastButton?: boolean;
  icon: React.ReactNode;
}) => (
  <Button
    asChild={hasPermission}
    aria-label={label}
    size="icon"
    variant={currentView === triggerView ? 'default' : 'outline'}
    className={cn(
      '-ml-px [&_svg]:size-5',
      isFirstButton && 'rounded-r-none',
      isLastButton && 'rounded-l-none',
      !isFirstButton && !isLastButton && 'rounded-none',
    )}
    disabled={!hasPermission}
  >
    <Link href={navigateURL(selectedDate, triggerView)}>{icon}</Link>
  </Button>
);

const FilterSummaryButton = ({ label, count, onClick }: { label: string; count: number; onClick: () => void }) => (
  <Button variant="outline" className="w-full h-16 justify-between px-4 rounded-xl border-2" onClick={onClick}>
    <div className="flex flex-col items-start">
      <span className="text-xs text-muted-foreground font-semibold uppercase">{label}</span>
      <span className="text-base">{count > 0 ? `${count} selected` : 'All'}</span>
    </div>
    <ChevronRight className="size-4 text-muted-foreground" />
  </Button>
);

const MobileViewOption = ({
  href,
  icon,
  label,
  value,
  isDisabled,
  id,
}: {
  href: string;
  icon: React.ReactElement;
  label: string;
  value: string;
  isDisabled: boolean;
  id: string;
}) => {
  const content = (
    <div
      className={cn(
        'flex items-center justify-between w-full p-4 rounded-xl border transition-all',
        'active:scale-[0.98] active:bg-accent',
        isDisabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">{icon}</div>
        <span className="font-medium text-base">{label}</span>
      </div>
      <RadioGroupItem value={value} id={value} disabled={isDisabled} className="pointer-events-none" />
    </div>
  );

  if (isDisabled) return content;

  return (
    <SheetClose asChild>
      <Link href={href} className="block w-full outline-none">
        {content}
      </Link>
    </SheetClose>
  );
};

const MobileDateControls = ({
  view,
  selectedDate,
  onPreviousClick,
  onNextClick,
}: {
  view: TCalendarView;
  selectedDate: Date;
  onPreviousClick: () => void;
  onNextClick: () => void;
}) => {
  const { push } = useRouter();

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center w-full py-2 gap-2 mx-4">
      <Button asChild size="lg" variant="ghost" className="px-2">
        <Link href={navigateURL(navigateDate(selectedDate, view, 'previous'), view)} onClick={onPreviousClick} aria-label="Previous day">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </Button>

      <div className="flex justify-center">
        <CalendarDayPopover
          id="TodayDate"
          disabled={false}
          value={selectedDate}
          onSelect={(selectedDate) => {
            if (!selectedDate) return;
            push(navigateURL(selectedDate, 'public'));
          }}
          placeholder={formatDate(selectedDate, 'MMMM do, yyyy')}
          data-invalid={false}
        >
          <Button size="lg" variant="ghost" className="text-base font-semibold px-2">
            <span className="whitespace-nowrap">{formatDate(selectedDate, 'PPP')}</span>
          </Button>
        </CalendarDayPopover>
      </div>

      <Button asChild size="lg" variant="ghost" className="px-2">
        <Link href={navigateURL(navigateDate(selectedDate, view, 'next'), view)} onClick={onNextClick} aria-label="Next day">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
};
