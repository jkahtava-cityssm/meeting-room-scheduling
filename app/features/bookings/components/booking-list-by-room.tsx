import { ScrollArea } from '@/components/ui/scroll-area';
import EventCard from './event-card';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderIcon, Terminal } from 'lucide-react';
import { IRoomSection, ISection } from './types';
import { useEventPatchMutation } from '@/lib/services/events';
import { useBookingContext } from '../context/BookingProvider';
import { useEffect, useState } from 'react';
import { SectionLayoutSkeleton } from './skeleton-booking-list';

export default function BookingListByRoom({ sections, page = 1 }: { sections: ISection[]; page?: number }) {
  const PAGE_SIZE = 100;

  const [paginatedSections, setPaginatedSections] = useState<ISection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    // Simulate async rendering (or replace with real API call if needed)
    const timer = setTimeout(() => {
      setPaginatedSections(sections.slice(startIndex, endIndex));
      setLoading(false);
    }, 300); // 300ms for UX

    return () => clearTimeout(timer);
  }, [page, sections]);

  const breakpoints = true
    ? 'w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)'
    : 'w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)';

  return (
    <div className={`flex flex-1 flex-col ${breakpoints}`}>
      {loading ? (
        <SectionLayoutSkeleton />
      ) : (
        <ScrollArea className="max-h-[calc(100vh-180px)] overflow-y-auto" type="always">
          <div className="relative">
            <div className="flex flex-col gap-6 max-w-screen-2xl pr-4">
              {paginatedSections.length === 0 ? (
                <NoContentWarning />
              ) : (
                paginatedSections.map((section) => {
                  return <SectionLayout key={section.sectionId} formattedDate={section.formattedDate} roomSections={section.roomSection} />;
                })
              )}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function SectionLayout({ formattedDate, roomSections }: { formattedDate: string; roomSections: IRoomSection[] }) {
  //{format(date, "EEEE, MMMM d, yyyy")
  const patchEvent = useEventPatchMutation();
  const { startDate, endDate, type, id, statusLookup } = useBookingContext();
  return (
    <div className="border-b">
      <div className="sticky top-0 bg-accent text-primary p-2 border-2 border-accent/50 shadow-sm  h-10 z-10" data-date={formattedDate}>
        <span className="flex-1 text-md">{formattedDate}</span>
      </div>

      <div className="grid">
        <div className="flex flex-wrap gap-4 p-4 ">
          {roomSections.map((roomSection, idx) =>
            roomSection.eventCards.map((eventCard, idx) => {
              return (
                <EventCard
                  key={String(eventCard.event.eventId)}
                  event={eventCard.event}
                  OnPending={() => {
                    patchEvent.mutate({
                      data: { eventId: eventCard.event.eventId, statusId: statusLookup('PENDING') },
                    });
                  }}
                  OnApprove={() => {
                    patchEvent.mutate({
                      data: { eventId: eventCard.event.eventId, statusId: statusLookup('APPROVED') },
                    });
                  }}
                  OnDeny={() => {
                    patchEvent.mutate({
                      data: { eventId: eventCard.event.eventId, statusId: statusLookup('REJECTED') },
                    });
                  }}
                ></EventCard>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

function NoContentWarning() {
  return (
    <div className="relative flex-1  p-4">
      <Alert className="mt-4 ">
        <Terminal className="h-4 w-4" />
        <AlertTitle>No Requests Found</AlertTitle>
        <AlertDescription>Please pick a different day, room, or status</AlertDescription>
      </Alert>
    </div>
  );
}
