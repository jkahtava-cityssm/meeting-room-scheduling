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
    <SidebarMenuButton size="lg" className="w-56 rounded-lg" onClick={() => handleLogOut(pathname)}>
      <LogOut />
      Logout
    </SidebarMenuButton>
  );
}
