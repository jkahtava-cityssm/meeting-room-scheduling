"use client";
import { PermissionGrid, Role, Resource, Action, PermissionMap } from "@/app/features/permissions/PermissionGrid";
import * as React from "react";

const roles: Role[] = [
  { roleId: 1, name: "Management" },
  { roleId: 2, name: "Super Administrator" },
  { roleId: 3, name: "Administrator3" },
  { roleId: 4, name: "Administrator4" },
  { roleId: 5, name: "Administrator5" },
  { roleId: 6, name: "Administrator6" },
  { roleId: 7, name: "Administrator7" },
  { roleId: 8, name: "Administrator8" },
  { roleId: 9, name: "Administrator9" },
];

const resources: Resource[] = [
  { resourceId: 10, name: "Events" },
  { resourceId: 20, name: "Rooms" },
];

const actions: Action[] = [
  { actionId: 100, name: "read" },
  { actionId: 110, name: "create" },
  { actionId: 120, name: "update" },
  { actionId: 130, name: "delete" },
];

const actionsByResource: Record<number, Action[]> = {
  10: [actions[0], actions[1], actions[2], actions[3]], // Events
  20: [actions[0], actions[2]], // Rooms
};

const k = (roleId: number, resourceId: number, actionId: number) => `${roleId}:${resourceId}:${actionId}`;

export default function PermissionsPage() {
  const [permissions, setPermissions] = React.useState<PermissionMap>(() => {
    const seed: PermissionMap = {};
    seed[k(1, 10, 110)] = true; // Role A can create Events
    seed[k(3, 10, 100)] = true; // Role C can read Events
    seed[k(2, 20, 120)] = true; // Role B can update Rooms
    return seed;
  });

  const handleToggle = React.useCallback(
    (cell: { roleId: number; resourceId: number; actionId: number }, nextValue: boolean) => {
      setPermissions((prev) => ({ ...prev, [k(cell.roleId, cell.resourceId, cell.actionId)]: nextValue }));
      // TODO: persist to your API (Prisma upsert on RoleResourceAction)
      // await api.updatePermit({ roleId: cell.roleId, resourceId: cell.resourceId, actionId: cell.actionId, permit: nextValue });
    },
    []
  );

  return (
    <div className="container mx-auto p-6">
      <PermissionGrid
        roles={roles}
        resources={resources}
        actionsByResource={actionsByResource}
        permissions={permissions}
        onToggle={handleToggle}
        yesLabel="YES"
        noLabel="NO"
        tooltipForDenied="Ask an admin to grant access"
      />
    </div>
  );
}
