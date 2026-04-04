import { Skeleton } from '@/components/ui/skeleton';
import { LoaderCircle } from 'lucide-react';
import { CalendarLoadingPage } from '../../calendar/loading';

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return <CalendarLoadingPage />;
}
