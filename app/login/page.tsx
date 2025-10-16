import Image from "next/image";
import { redirect } from "next/navigation";
import { SignInMicrosoft } from "@/components/sign-in-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkSessionPermission } from "@/lib/auth-client";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    checkSessionPermission(session, "Event", "Read");
    redirect("/bookings/user-view");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center rounded-md">
              <Image
                src="/images/city-shield-wreath-cmyk.svg"
                alt="An image of the crest and wreath of the city of Sault Ste. Marie"
                width={180}
                height={180}
                style={{ width: "180px", height: "180px" }}
                priority={true}
              />
            </div>

            <h1 className="text-xl">City of Sault Ste. Marie</h1>
            <h1 className="text-2xl font-bold">Room Scheduling/Booking</h1>
            <div className="flex flex-col items-center gap-2 m-4">
              <SignInMicrosoft />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
