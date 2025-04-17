
import Image from "next/image";
import { redirect } from "next/navigation";
import AuthProvider from "./component/AuthProvider";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/sign-in-button";



export default async function Home() {
  return (
    
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center rounded-md">
                <Image
                  src="/city-shield-wreath-cmyk.svg"
                  alt="An image of the crest and wreath of the city of Sault Ste. Marie"
                  width={180}
                  height={180}
                />
              </div>

              <h1 className="text-xl">City of Sault Ste. Marie</h1>
              <h1 className="text-2xl font-bold">Room Scheduling/Booking</h1>
              <div className="m-4">
                <SignInButton></SignInButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
}
