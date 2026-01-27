import { AppSidebar } from "@/components/nav-sidebar";
import { SiteHeader } from "@/components/nav-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const iframeHeight = "800px";

export const description = "A sidebar with a header and a search form.";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
		<div className="[--header-height:calc(--spacing(14))] overflow-hidden">
			<SidebarProvider className="flex flex-col">
				<SiteHeader />
				<div className="flex flex-1">
					<AppSidebar />
					<SidebarInset>
						<div className="gap-4 p-4 h-[calc(100vh-var(--header-height)-1px)] flex flex-col">{children}</div>
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	);
}
