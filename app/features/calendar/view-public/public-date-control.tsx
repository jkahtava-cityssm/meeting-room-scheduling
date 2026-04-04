import { CalendarDayPopover } from '@/components/calendar-day-popover/calendar-day-popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { navigateDate, navigateURL } from '@/lib/helpers';
import { formatDate } from 'date-fns';
import { ChevronLeft, ChevronRight, FilterIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PublicHeader({
  selectedDate,
  isMounting,
  filterRoom,
  leftContent,
  rightContent,
}: {
  selectedDate: Date;
  isMounting: boolean;
  filterRoom: () => void;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}) {
  return (
    <div
      className=" grid
    w-full
    gap-4
    grid-cols-[minmax(220px,400px)_minmax(400px,1fr)]
    grid-rows-[auto_1fr]"
    >
      {/* LEFT HEADER (row 1, col 1) */}
      <div className="flex flex-row flex-wrap items-center gap-2 border-b py-4 mb-4 min-w-0">
        <Label className="text-md font-bold h-8">Room Filters</Label>
        <Button size="sm" className="text-xs w-50 mt-2" onClick={filterRoom}>
          <FilterIcon /> Select Rooms with Projectors
        </Button>
      </div>
      {/* RIGHT HEADER (row 1, col 2) */}
      <div className="border-b py-4 mb-4 flex items-end justify-end min-w-0">
        {isMounting ? <DateControlSkeleton selectedDate={selectedDate} /> : <DateControls selectedDate={selectedDate} />}
      </div>
      {/* LEFT CONTENT (row 2, col 1) */} <div className="min-w-0"> {leftContent} </div>
      {/* RIGHT CONTENT (row 2, col 2) */} <div className="min-w-0"> {rightContent} </div>
    </div>
  );
}

export const DateControls = ({ selectedDate }: { selectedDate: Date }) => {
  const { push } = useRouter();

  const [currentDate, setCurrentDate] = useState<Date>(selectedDate);

  const handleNavigatePrevious = () => {
    const previousDate = navigateDate(selectedDate, 'day', 'previous');
    setCurrentDate(previousDate);
    push(navigateURL(previousDate, 'public'));
  };

  const handleNavigateNext = () => {
    const nextDate = navigateDate(selectedDate, 'day', 'next');
    setCurrentDate(nextDate);
    push(navigateURL(nextDate, 'public'));
  };

  return (
    <div className="grid grid-cols-2 gap-2 auto-cols-min w-full items-center min-w-65 lg:grid-cols-[auto_minmax(10rem,1fr)_auto] py-2">
      <div className="justify-self-end order-2 lg:order-1 lg:col-start-1 lg:row-start-1">
        <Button asChild className="w-30" size="sm">
          <Link
            href={navigateURL(navigateDate(selectedDate, 'day', 'previous'), 'public')}
            onClick={(e) => {
              e.preventDefault();
              handleNavigatePrevious();
            }}
          >
            <ChevronLeft />
            Previous
          </Link>
        </Button>
      </div>

      <div className="justify-self-center col-span-2 order-1 lg:order-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
        <CalendarDayPopover
          id={`}Date`}
          disabled={false}
          value={currentDate}
          onSelect={(selectedDate) => {
            if (!selectedDate) return;
            setCurrentDate(selectedDate);
            push(navigateURL(selectedDate, 'public'));
          }}
          placeholder={formatDate(currentDate, 'MMMM do, yyyy')}
          className="block text-base font-semibold w-40"
          data-invalid={false}
        >
          <Button size={'sm'} variant="ghost" className="block text-base font-semibold ">
            {<span>{formatDate(currentDate, 'PPP')}</span>}
          </Button>
        </CalendarDayPopover>
      </div>

      <div className="justify-self-start order-3 lg:order-3 lg:col-start-3 lg:row-start-1">
        <Button asChild className="w-30" size="sm">
          <Link
            href={navigateURL(navigateDate(selectedDate, 'day', 'next'), 'public')}
            onClick={(e) => {
              e.preventDefault();
              handleNavigateNext();
            }}
          >
            Next
            <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const DateControlSkeleton = ({ selectedDate }: { selectedDate: Date }) => {
  return (
    <div className="grid grid-cols-2 gap-2 auto-cols-min w-full items-center min-w-65 lg:grid-cols-[auto_minmax(10rem,1fr)_auto] py-2">
      <div className="text-center justify-self-center col-span-2 lg:col-start-2 lg:col-span-1 lg:row-start-1">
        <Skeleton className="w-45 h-8 inline-flex items-center justify-center text-base font-semibold ">{formatDate(selectedDate, 'PPP')}</Skeleton>
      </div>
      <div className="justify-self-end lg:col-start-1">
        <Skeleton className="w-30 h-8"></Skeleton>
      </div>
      <div className="justify-self-start lg:col-start-3">
        <Skeleton className="w-30 h-8"></Skeleton>
      </div>
    </div>
  );
};
