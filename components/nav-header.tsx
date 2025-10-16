"use client";

import { SidebarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { NavUser } from "./nav-header-user";
import { Skeleton } from "./ui/skeleton";
import { useClientSession } from "@/hooks/use-client-auth";

export interface IUser {
  name: string | undefined;
  email: string | undefined;
  image: string | undefined;
}

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { session, isPending } = useClientSession();
  //console.log("SITE HEADER RE-RENDER????");
  //console.log(session?.user);

  //console.log(user);

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        {isPending ? (
          <Skeleton className="h-8 w-8 " />
        ) : (
          <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
            <SidebarIcon />
          </Button>
        )}
        <Separator orientation="vertical" className="mr-2 h-4" />
        {/*<Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>*/}
        <div className="w-full sm:ml-auto sm:w-auto">
          {session && <NavUser isPending={isPending} session={session} />}
        </div>
      </div>
    </header>
  );
}
