'use client';

import { signOut } from '@/lib/auth-client';

import { redirect, usePathname } from 'next/navigation';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';

export function SignOutMenuItem() {
  const pathname = usePathname();

  const handleLogOut = () => {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          redirect('/?callbackurl=' + pathname); // redirect to login page
        },
      },
    });
  };

  return (
    <DropdownMenuItem onSelect={handleLogOut}>
      <LogOut />
      Logout
    </DropdownMenuItem>
  );
}
