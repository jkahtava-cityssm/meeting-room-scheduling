"use client";

import { MicrosoftButton } from "@/components/ui/microsoft-signin-button";
import { fetchPOST } from "@/lib/fetch";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function RegisterSSO() {
  const [disabled, setDisabled] = useState(false);
  const [pending, setPending] = useState(false);

  async function onRegisterSSO() {
    if (pending || disabled) return;

    setPending(true);
    setDisabled(true);

    const result = await fetchPOST("/api/admin/register-sso", {});
    if (!result?.ok) {
      setDisabled(false);
      console.log(result?.error);
    }
    setPending(false);
  }

  return (
    <>
      <MicrosoftButton onClick={() => onRegisterSSO()} disabled={disabled} aria-busy={pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        {!pending && (
          <Image
            src="/images/ms-symbollockup_mssymbol_19.svg"
            alt="An image of the crest and wreath of the city of Sault Ste. Marie"
            width={21}
            height={21}
          />
        )}
        Register SSO
      </MicrosoftButton>
    </>
  );
}
