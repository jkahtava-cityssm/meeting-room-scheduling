import { Skeleton } from '@/components/ui/skeleton';

export default function PermissionLoadingState() {
  return (
    <div className="overflow-hidden rounded-xl border min-w-92">
      <Skeleton className="w-full h-full" />
    </div>
  );
}
