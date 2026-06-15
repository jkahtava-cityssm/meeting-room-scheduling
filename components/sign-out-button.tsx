'use client';

import { signOut } from '@/lib/auth-client';

import { redirect, usePathname } from 'next/navigation';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { SidebarMenuButton } from './ui/sidebar';

const handleLogOut = (pathname: string) => {
  signOut({
    fetchOptions: {
      onSuccess: () => {
        redirect('/?callbackurl=' + pathname);
      },
    },
  });
};

export function SignOutMenuItem() {
  const pathname = usePathname();

  return (
    <DropdownMenuItem onSelect={() => handleLogOut(pathname)}>
      <LogOut />
      Logout
    </DropdownMenuItem>
  );
}

export function SignOutMenuButton() {
  const pathname = usePathname();

  return (
    <SidebarMenuButton
      size="lg"
      tooltip="Session Issue - Please Logout"
      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 max-w-75 rounded-lg flex items-center justify-start gap-3 border border-destructive/15 bg-destructive/5 text-destructive/90 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
      onClick={() => handleLogOut(pathname)}
    >
      {/* The icon now sits comfortably on the left side of the text */}
      <LogOut className="w-4 h-4 shrink-0 animate-pulse text-destructive" />

      <div className="flex flex-col text-left text-sm leading-tight">
        <span className="truncate font-medium">Logout</span>
        <span className="text-[10px] opacity-70 font-normal">Session issue</span>
      </div>
    </SidebarMenuButton>
  );
}
