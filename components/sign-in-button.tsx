'use client';

import Image from 'next/image';
import { MicrosoftButton } from './ui/microsoft-signin-button';
import { useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { APP_FULL_URL, APP_SUBFOLDER } from '@/lib/api-helpers';

const signInGitHub = async (callback: string) => {
  const data = await signIn.social({
    provider: 'github',
    callbackURL: callback,
  });
  return data;
};

const signInEntra = async (callback: string) => {
  const data = await signIn.social({
    provider: 'microsoft',
    callbackURL: callback,
    scopes: ['email', 'openid', 'profile', 'offline_access', 'User.Read', 'User.Read.All', 'User.ReadBasic.All', 'Mail.Send'],
  });
  return data;
};

const signInEntraSSO = async (callback: string) => {
  const res = await authClient.signIn.sso({
    providerId: 'microsoft',
    callbackURL: callback, // where to land post-login
    // errorCallbackURL: "/auth/error", // optional
  });
  return res;
};

export function SignInMicrosoft() {
  const searchParams = useSearchParams();

  const callbackURL = searchParams.get('callbackurl') == null ? `${APP_SUBFOLDER}/bookings/user-view` : (searchParams.get('callbackurl') as string);

  return (
    <>
      <MicrosoftButton onClick={() => signInEntra(callbackURL)}>
        <Image
          src={`${APP_FULL_URL}/images/ms-symbollockup_mssymbol_19.svg`}
          alt="An image of the crest and wreath of the city of Sault Ste. Marie"
          width={21}
          height={21}
        />
        Sign in with Microsoft
      </MicrosoftButton>
    </>
  );
}

export function SignInGithub() {
  const { resolvedTheme } = useTheme();

  const searchParams = useSearchParams();

  const callbackURL = searchParams.get('callbackurl') == null ? `${APP_SUBFOLDER}/bookings/user-view` : (searchParams.get('callbackurl') as string);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Button onClick={() => signInGitHub(callbackURL)}>
        {mounted ? (
          <Image
            src={resolvedTheme === 'light' ? `${APP_FULL_URL}/images/github-mark-white.svg` : `${APP_FULL_URL}/images/github-mark.svg`}
            alt="An image of the crest and wreath of the city of Sault Ste. Marie"
            width={21}
            height={21}
          />
        ) : (
          <Loader2Icon className="h-5.25 w-5.25 animate-spin" />
        )}
        Sign in with GitHub
      </Button>
    </>
  );
}

export function SignInMicrosoftSSO() {
  const searchParams = useSearchParams();

  const callbackURL = searchParams.get('callbackurl') == null ? '/bookings/user-view' : (searchParams.get('callbackurl') as string);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <MicrosoftButton onClick={() => signInEntraSSO(callbackURL)}>
        <Image
          src={`${APP_FULL_URL}/images/ms-symbollockup_mssymbol_19.svg`}
          alt="An image of the crest and wreath of the city of Sault Ste. Marie"
          width={21}
          height={21}
        />
        Sign in with Microsoft
      </MicrosoftButton>
    </>
  );
}
