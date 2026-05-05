import Image from 'next/image';
import { redirect } from 'next/navigation';
import { SignInGithub, SignInMicrosoft, SignInMicrosoftSSO } from '@/components/sign-in-button';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

import { ThemeButton } from '@/components/theme-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PublicHeader } from '@/components/public-header';
import { findManyConfiguration } from '@/lib/data/configuration';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect('/availability');
  }

  const configEntries = await findManyConfiguration(['singleSignOnEnabled']);
  const useSSO = configEntries.find((entry) => entry.key === 'singleSignOnEnabled')?.value === 'true';

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <PublicHeader
        left={
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/menu_logo.svg`}
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
              <Link href={'/'}>Home</Link>
            </Button>
          </div>
        }
        title="Room Scheduling/Booking"
      >
        <div
          className="flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10"
          style={{ minHeight: 'calc(100vh - var(--header-height) - 1px)' }}
        >
          <div className="w-full">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center rounded-md">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}/images/login_logo.svg`}
                    alt="An image of the crest and wreath of the city of Sault Ste. Marie"
                    width={180}
                    height={180}
                    style={{ width: '180px', height: '180px' }}
                    priority={true}
                  />
                </div>

                <h1 className="text-xl">City of Sault Ste. Marie</h1>
                <h1 className="text-2xl font-bold">Room Scheduling/Booking</h1>
                {!useSSO && (
                  <div className="flex flex-col items-center gap-2 m-4">
                    <SignInMicrosoft />
                  </div>
                )}
                {useSSO && (
                  <div className="flex flex-col items-center gap-2 m-4">
                    <SignInMicrosoftSSO />
                  </div>
                )}
                {process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (
                  <div className="flex flex-col items-center gap-2 m-4">
                    <SignInGithub />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PublicHeader>
    </div>
  );
}
