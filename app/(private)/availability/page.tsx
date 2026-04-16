import { CalendarPublicView } from '@/app/features/calendar/view-public/public-view';

import { CalendarProviderPublic } from '@/contexts/CalendarProviderPublic';

export default function Availability() {
  return (
    <CalendarProviderPublic>
      <CalendarPublicView></CalendarPublicView>
    </CalendarProviderPublic>
  );
}
