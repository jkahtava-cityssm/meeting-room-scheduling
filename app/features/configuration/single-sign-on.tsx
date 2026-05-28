'use client';

import { MicrosoftButton } from '@/components/ui/microsoft-signin-button';
import { fetchPOST } from '@/lib/fetch-client';
import { Loader2Icon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { APP_FULL_URL } from '@/lib/api-helpers';

export function RegisterSSO({ isActive }: { isActive?: boolean }) {
  const [active, setActive] = useState(isActive);
  const [pending, setPending] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  async function onRegisterSSO() {
    if (pending) return;

    setPending(true);

    const result = await fetchPOST<null>('/api/admin/register-sso', {});
    if (result?.success) {
      setActive(true);
    }
    setPending(false);
  }

  return (
    <>
      <MicrosoftButton onClick={() => setShowAlert(true)} disabled={pending} aria-busy={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        {!pending && (
          <Image
            src={`${APP_FULL_URL}/images/ms-symbollockup_mssymbol_19.svg`}
            alt="An image of the crest and wreath of the city of Sault Ste. Marie"
            width={21}
            height={21}
          />
        )}
        {active ? `Reset Microsoft Entra SSO` : `Activate Microsoft Entra SSO`}
      </MicrosoftButton>

      <WarningDialog
        showAlert={showAlert}
        onContinue={() => {
          setShowAlert(false);
          onRegisterSSO();
        }}
        setShowAlert={setShowAlert}
      ></WarningDialog>
    </>
  );
}

const WarningDialog: React.FC<{
  showAlert: boolean;
  onContinue: () => void;

  setShowAlert: (show: boolean) => void;
}> = ({ showAlert, onContinue, setShowAlert }) => (
  <AlertDialog open={showAlert}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirm: SSO Registration Request</AlertDialogTitle>
        <AlertDialogDescription>This action cannot be reversed from within the application, and requires manual intervention.</AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogAction onClick={onContinue}>Continue</AlertDialogAction>

        <AlertDialogCancel onClick={() => setShowAlert(false)}>Cancel </AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

/*
<MicrosoftLabel className="text-green-600">
          Single Sign On Configured
          <CheckIcon className="w-4 h-4 " />
        </MicrosoftLabel>
*/
