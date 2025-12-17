import { MicrosoftButton } from "@/components/ui/microsoft-signin-button";
import { fetchPOST } from "@/lib/fetch";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

async function onRegisterSSO() {
  const res = await fetchPOST("/api/admin/register-sso", {});
  if (!res?.ok) {
    // handle error
    //alert(res?.error ?? "Registration failed");
    console.log(res?.error);
    return;
  }
}

export function RegisterSSO() {
  const searchParams = useSearchParams();

  return (
    <>
      <MicrosoftButton onClick={() => onRegisterSSO()}>
        <Image
          src="/images/ms-symbollockup_mssymbol_19.svg"
          alt="An image of the crest and wreath of the city of Sault Ste. Marie"
          width={21}
          height={21}
        />
        Register SSO
      </MicrosoftButton>
    </>
  );
}
