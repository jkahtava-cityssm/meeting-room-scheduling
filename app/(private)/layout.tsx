import { AppSidebar } from "@/app/features/navigation/nav-sidebar";
import { SiteHeader } from "@/app/features/navigation/nav-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SessionProvider } from "@/contexts/SessionProvider";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="[--header-height:calc(--spacing(14))] overflow-hidden">
      <SidebarProvider className="flex flex-col">
        <SessionProvider>
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset className="gap-4 sm:p-4 h-[calc(100vh-var(--header-height)-1px)] transition-[width] duration-300 min-w-0 flex flex-col overflow-hidden">
              {children}
            </SidebarInset>
          </div>
        </SessionProvider>
      </SidebarProvider>
    </div>
  );
}
