import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeButton } from "@/components/theme-button";
import { PublicHeader } from "@/components/public-header";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/availability");
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <PublicHeader
        left={
          <Image
            src="/images/city-shield-wreath-cmyk.svg"
            alt="An image of the crest and wreath of the city of Sault Ste. Marie"
            width={32}
            height={32}
            style={{ width: "32px", height: "32px" }}
            priority={true}
          />
        }
        right={
          <div className="flex gap-2">
            <ThemeButton />
            <Button>
              <Link href={"/login"}>Sign In</Link>
            </Button>
          </div>
        }
        title="Meeting Room Availability"
      />
      <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
        <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
          <Image
            src="/images/city-shield-wreath-cmyk.svg"
            alt="An image of the crest and wreath of the city of Sault Ste. Marie"
            width={32}
            height={32}
            style={{ width: "32px", height: "32px" }}
            priority={true}
          />
          <div className="w-full sm:ml-auto sm:w-auto">
            <h1 className="text-2xl font-bold">Meeting Room Availability</h1>
          </div>
          <div className="w-full sm:ml-auto sm:w-auto">
            <div className="flex gap-2">
              <ThemeButton />
              <Button>
                <Link href={"/login"}>Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
