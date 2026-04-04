'use client';

import { MicrosoftButton, MicrosoftLabel } from '@/components/ui/microsoft-signin-button';
import { fetchPOST } from '@/lib/fetch';
import { usePublicConfiguration } from '@/lib/services/public';
import { CheckIcon, CheckSquare, Loader2Icon, X } from 'lucide-react';
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
  AlertDialogSave,
} from '@/components/ui/alert-dialog';

export function RegisterSSO({ isDisabled }: { isDisabled?: boolean }) {
  const [disabled, setDisabled] = useState(isDisabled);
  const [pending, setPending] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  async function onRegisterSSO() {
    if (pending || disabled) return;

    setPending(true);
    setDisabled(true);

    const result = await fetchPOST('/api/admin/register-sso', {});
    if (result?.status !== 204) {
      setDisabled(false);
    }
    setPending(false);
  }

  return (
    <>
      {disabled ? (
        <>
          <MicrosoftLabel>
            <Image
              src="/images/ms-symbollockup_mssymbol_19.svg"
              alt="An image of the crest and wreath of the city of Sault Ste. Marie"
              width={21}
              height={21}
            />
            Single Sign On Configured
            <CheckIcon className="w-4 h-4 text-green-600" />
          </MicrosoftLabel>
        </>
      ) : (
        <MicrosoftButton onClick={() => setShowAlert(true)} disabled={disabled} aria-busy={pending}>
          {pending && <Loader2Icon className="animate-spin" />}
          {!pending && (
            <Image
              src="/images/ms-symbollockup_mssymbol_19.svg"
              alt="An image of the crest and wreath of the city of Sault Ste. Marie"
              width={21}
              height={21}
            />
          )}
          Activate Microsoft Entra SSO
        </MicrosoftButton>
      )}
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
