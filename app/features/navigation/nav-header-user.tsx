'use client';

import { CheckSquare, ChevronDown, RefreshCw, SunMoon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { SignOutMenuItem } from '../../../components/sign-out-button';
import { Skeleton } from '../../../components/ui/skeleton';
import { Switch } from '../../../components/ui/switch';
import { useTheme } from 'next-themes';
import { IUser } from './nav-header';
import { authClient, getSessionRoles, Session, useVerifySessionRequirement } from '@/lib/auth-client';
import { useRevalidateAndInvalidate } from '@/hooks/use-revalidate-cache';
import { GroupedPermissionRequirement } from '@/lib/auth-permission-checks';
import { RoleSelect } from '@/app/features/roles/role-select';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { fetchDELETE, fetchPOST } from '@/lib/fetch-client';
import { useRouter } from 'next/navigation';

const PAGE_PERMISSIONS = {
  IsAdmin: { type: 'role', role: 'Admin' },
} as const satisfies GroupedPermissionRequirement;

export function NavUser({ session, isPending }: { session: Session; isPending: boolean }) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();

  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);

  const user: IUser = {
    name: session?.user.name ? session.user.name : undefined,
    email: session?.user.email ? session.user.email : undefined,
    image: session?.user.image ? session.user.image : undefined,
  };

  const { permissions } = useVerifySessionRequirement(session, PAGE_PERMISSIONS);

  const isImpersonating = Boolean(session?.session?.impersonatedRole);

  const listRoles = getSessionRoles(session);

  const handleAddImpersonation = async (roleId: string) => {
    const result = await fetchPOST<{ sessionId: string; impersonatedRole: string }>('/api/admin/impersonate', { roleId: roleId });
    const session = await authClient.getSession({
      query: {
        disableCookieCache: true,
      },
    });

    window.location.reload();
    return result;
  };

  const handleRemoveImpersonation = async () => {
    const result = await fetchDELETE<null>(`/api/admin/impersonate`);
    const session = await authClient.getSession({
      query: {
        disableCookieCache: true,
      },
    });
    window.location.reload();
    return result;
  };

  if (isPending) {
    return (
      <SidebarMenuButton size="lg" className="w-56 rounded-lg">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="grid flex-1 text-left text-sm leading-tight space-y-2">
          <Skeleton className="h-2" />
          <Skeleton className="h-2" />
        </div>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-(--radix-dropdown-menu-trigger-width) min-w-56 max-w-75 rounded-lg">
              {
                //rounded-2xl
              }
              <Avatar className="h-8 w-8 border-2">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} className={resolvedTheme === 'dark' ? 'mask-radial-from-50%' : ''} />
                ) : (
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'bottom'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={(event) => {
                  event.preventDefault();
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                }}
              >
                <SunMoon />
                Dark Mode
                <Switch
                  checked={resolvedTheme === 'dark'}
                  onClick={() => {
                    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                  }}
                ></Switch>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <SignOutMenuItem />

            {process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (
              <>
                <DropdownMenuSeparator />
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Roles:</span> {listRoles?.join(', ')}
                  </div>
                </div>
              </>
            )}

            {permissions.IsAdmin && (
              <>
                <DropdownMenuSeparator />
                <div className="flex flex-row gap-1">
                  <RoleSelect
                    selectedRoleId={selectedRoleId ? selectedRoleId : ''}
                    onRoleChange={setSelectedRoleId}
                    excludeRoleNames={['Admin']}
                    className={'w-full'}
                  ></RoleSelect>
                  <Button
                    disabled={!selectedRoleId}
                    onClick={() => handleAddImpersonation(selectedRoleId ? selectedRoleId : '')}
                    className=" bg-transparent aria-invalid:hover:text-destructive dark:aria-invalid:hover:bg-destructive/10 dark:bg-input/30 dark:hover:bg-input/50 text-muted-foreground border-input border hover:bg-accent   "
                  >
                    <CheckSquare />
                  </Button>
                </div>
              </>
            )}

            {isImpersonating && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleRemoveImpersonation()}>
                  Stop Impersonating [{session?.session?.impersonatedRole}]
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default function RefreshMenuItem() {
  const { revalidateAndInvalidate } = useRevalidateAndInvalidate();

  const handleClick = async () => {
    const result = await revalidateAndInvalidate();
    if (result.success) {
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <DropdownMenuItem onClick={handleClick}>
      <RefreshCw />
      Refresh API Routes
    </DropdownMenuItem>
  );
}
