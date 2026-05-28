import { PublicHeader } from '@/components/public-header';
import { ThemeButton } from '@/components/theme-button';
import { Button } from '@/components/ui/button';

export default function Loading() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <PublicHeader
        left={
          // Empty skeleton matching the logo dimensions
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        }
        right={
          <div className="flex gap-2">
            <ThemeButton />
            <Button disabled>Home</Button>
          </div>
        }
        title="Room Scheduling/Booking"
      >
        <div
          className="flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10"
          style={{ minHeight: 'calc(100vh - var(--header-height) - 1px)' }}
        >
          <div className="w-full max-w-[180px] flex flex-col items-center gap-4">
            {/* Logo Skeleton */}
            <div className="w-[180px] h-[180px] rounded-md bg-muted animate-pulse" />
            {/* Text Skeletons */}
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            {/* Button Skeleton */}
            <div className="h-10 w-full bg-muted rounded mt-4 animate-pulse" />
          </div>
        </div>
      </PublicHeader>
    </div>
  );
}
