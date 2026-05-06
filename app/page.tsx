import React, { Suspense } from 'react';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ThemeButton } from '@/components/theme-button';
import { PublicHeader } from '@/components/public-header';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { CalendarPublicView } from './features/calendar/view-public/public-view';
import { CalendarProviderPublic } from '@/contexts/CalendarProviderPublic';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect('/availability');
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <PublicHeader
        left={
          <Image
            src={`${process.env.NEXT_PUBLIC_FULL_URL}/images/login_logo.svg`}
            alt="An image of the crest and wreath of the city of Sault Ste. Marie"
            width={32}
            height={32}
            style={{ width: '32px', height: '32px' }}
            priority={true}
          />
        }
        right={
          <div className="flex gap-2">
            <ThemeButton />
            <Button>
              <Link href={'/login'}>Sign In</Link>
            </Button>
          </div>
        }
        title="Meeting Room Availability"
      >
        <div className="gap-4 sm:p-4 h-[calc(100vh-var(--header-height)-1px)] transition-[width] duration-300 min-w-0 flex flex-col overflow-y-auto">
          <div className="overflow-hidden min-w-92 flex flex-1 flex-col min-h-0">
            <Suspense fallback={<>...Loading</>}>
              <CalendarProviderPublic>
                <CalendarPublicView></CalendarPublicView>
              </CalendarProviderPublic>
            </Suspense>
          </div>
        </div>
      </PublicHeader>
    </div>
  );
}
