"use client";

import { useEffect, useState, Fragment, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissionMutationUpsert, usePermissionsQuery } from "@/lib/services/permissions";
import { IPermissionSet } from "@/lib/data/permissions";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { isEqual } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";

export type ResourceActions = {
  resourceId: string;
  resourceName: string;
  actions: { actionId: string; actionName: string }[];
}[];

type PermissionGridProps = {
  yesLabel?: string; // default YES
  noLabel?: string; // default NO
  // Optional: show tips on hover to explain permission
  tooltipForDenied?: string; // e.g., "Ask an admin for access"
};

export function PermissionGrid({
  yesLabel = "YES",
  noLabel = "NO",
  tooltipForDenied = "Insufficient permissions",
}: PermissionGridProps) {
  const { data: serverPermissions, isLoading, error } = usePermissionsQuery();

  const [workingPermissions, setWorkingPermissions] = useState<IPermissionSet[] | undefined>(undefined);
  const [isChanged, setChanged] = useState(false);
  //const [resourceActions, setResourceActions] = useState<ResourceActions | undefined>(undefined);

  useEffect(() => {
    if (serverPermissions) {
      // Deep-ish clone (assuming shallow for entries is fine)
      setWorkingPermissions(structuredClone(serverPermissions));
    }
  }, [serverPermissions]);

  const resourceActions = useMemo(() => {
    if (!workingPermissions || workingPermissions.length === 0) return undefined;
    return getDistinctResources(workingPermissions);
  }, [workingPermissions]);

  const onToggle = useCallback(
    (
      roleId: string,
      resourceId: string,
      resourceName: string,
      actionId: string,
      actionName: string,
      next: boolean | "indeterminate",
    ) => {
      if (!workingPermissions) return;
      setChanged(true);
      const isChecked = next === true;
      setWorkingPermissions((prev) =>
        prev ? setPermit(prev, roleId, resourceId, resourceName, actionId, actionName, isChecked) : prev,
      );
    },
    [workingPermissions],
  );

  const putPermission = usePermissionMutationUpsert();

  if (isLoading || error || !workingPermissions || !resourceActions) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="h-16 border-b bg-background flex items-center px-6 shrink-0">
        <h1 className="font-bold">Permission Management</h1>
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-120 border-r">
          <div className="relative flex-1 min-h-0 w-full overflow-hidden">
            <ScrollArea className="h-full w-full" type="always">
              <TooltipProvider>
                <Table className="w-auto  min-h-0 table-fixed">
                  <colgroup className="">
                    {/* First column: Resource / Action */}
                    <col style={{ minWidth: "fit-content" }} />
                    {/* One <col> per role; you can fix or let them auto */}
                    {workingPermissions.map((permissionSet) => (
                      <col
                        key={permissionSet.roleId}
                        style={{ minWidth: "fit-content" }} /* auto width or set a fixed %/px if you prefer */
                      />
                    ))}
                  </colgroup>

                  {/* Header */}
                  <TableHeader className="shadow-lg">
                    <TableRow className="bg-background hover:bg-background border-none">
                      <TableHead className="pr-4">Action</TableHead>
                      {workingPermissions.map((permissionSet) => (
                        <TableHead key={permissionSet.roleId} className="text-center px-4 ">
                          {permissionSet.roleName}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {resourceActions.map((resourceAction) => {
                      return (
                        <Fragment key={resourceAction.resourceId}>
                          {/* Resource Title Row */}
                          <TableRow className="bg-muted hover:bg-muted border ">
                            <TableCell colSpan={workingPermissions.length + 1} className="font-semibold pr-4">
                              {resourceAction.resourceName}
                            </TableCell>
                          </TableRow>

                          {/* Actions for resource */}
                          {resourceAction.actions.map((action) => (
                            <TableRow key={`${resourceAction.resourceId}:${action.actionId}`} className="border-t ">
                              {/* Action label */}
                              <TableCell className="font-medium px-4">{action.actionName}</TableCell>

                              {/* One cell per role */}
                              {workingPermissions.map((permissionSet) => {
                                const isAllowed = permissionSet.permissions.some(
                                  (t) =>
                                    t.actionId === action.actionId &&
                                    t.resourceId === resourceAction.resourceId &&
                                    t.permit === true,
                                ); //!!permissions[k];

                                return (
                                  <TableCell
                                    key={`${permissionSet.roleId}:${resourceAction.resourceId}:${action.actionId}`}
                                    className="text-center "
                                  >
                                    <div className="flex flex-col items-center gap-1">
                                      {/* Toggle */}
                                      <Checkbox
                                        disabled={
                                          permissionSet.roleName === "Admin" || permissionSet.roleName === "Public"
                                        }
                                        checked={isAllowed}
                                        onCheckedChange={(next) =>
                                          onToggle(
                                            permissionSet.roleId,
                                            resourceAction.resourceId,
                                            resourceAction.resourceName,
                                            action.actionId,
                                            action.actionName,
                                            next,
                                          )
                                        }
                                        aria-label={`${resourceAction.resourceName}:${action.actionName} for ${
                                          permissionSet.roleName
                                        } = ${isAllowed ? yesLabel : noLabel}`}
                                      />
                                    </div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TooltipProvider>
              <ScrollBar orientation="vertical" forceMount />
            </ScrollArea>
          </div>
          <footer className="flex h-14 items-center border-t bg-background px-4 shrink-0">
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                disabled={!isChanged}
                variant="ghost"
                onClick={() => {
                  setWorkingPermissions(structuredClone(serverPermissions));
                  setChanged(false);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!isChanged}
                onClick={() => {
                  if (!serverPermissions) return;
                  const differences = getDifferences(serverPermissions, workingPermissions);
                  if (differences.length === 0) return;
                  putPermission.mutate(differences, {
                    onSuccess: () => {
                      setChanged(false);
                    },
                  });
                }}
              >
                Save Changes
              </Button>
            </div>
          </footer>
        </div>
        <aside className="w-full shrink-0 bg-muted/30 p-4 hidden md:block">
          <h2 className="text-sm font-semibold">Another Section</h2>
          <p className="text-xs text-muted-foreground">Details or side info goes here.</p>
        </aside>
      </div>
      <footer className="flex h-14 items-center border-t bg-background px-4 shrink-0">
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </footer>
    </div>
  );
}

function getDistinctResources(permissionSets: IPermissionSet[]) {
  const byResource = new Map<string, { resourceId: string; resourceName: string; actions: Map<string, string> }>();

  for (const set of permissionSets) {
    for (const p of set.permissions) {
      let bucket = byResource.get(p.resourceId);
      if (!bucket) {
        bucket = {
          resourceId: p.resourceId,
          resourceName: p.resource,
          actions: new Map<string, string>(),
        };
        byResource.set(p.resourceId, bucket);
      }
      if (!bucket.actions.has(p.actionId)) {
        bucket.actions.set(p.actionId, p.action);
      }
    }
  }

  return Array.from(byResource.values()).map((bucket) => ({
    resourceId: bucket.resourceId,
    resourceName: bucket.resourceName,
    actions: Array.from(bucket.actions.entries()).map(([actionId, actionName]) => ({
      actionId,
      actionName,
    })),
  }));
}

function setPermit(
  sets: IPermissionSet[],
  roleId: string,
  resourceId: string,
  resourceName: string,
  actionId: string,
  actionName: string,
  nextValue: boolean,
): IPermissionSet[] {
  return sets.map((set) => {
    if (set.roleId !== roleId) return set;

    // Find entry; if missing, optionally create it (depends on your backend model)
    const idx = set.permissions.findIndex((p) => p.resourceId === resourceId && p.actionId === actionId);

    if (idx === -1) {
      // If permissions are sparse per role, you might need to add a new entry
      return {
        ...set,
        permissions: [
          ...set.permissions,
          {
            permissionId: "-1",
            permit: nextValue,
            actionId,
            action: actionName,
            resourceId,
            resource: resourceName,
          },
        ],
      };
    }

    // Update existing entry immutably
    const updated = [...set.permissions];
    updated[idx] = { ...updated[idx], permit: nextValue };
    return { ...set, permissions: updated };
  });
}

function getDifferences(serverPermissions: IPermissionSet[], updatedPermissions: IPermissionSet[]) {
  const updateList = [];

  for (let roleIndex = 0; roleIndex < serverPermissions.length; roleIndex++) {
    const serverRole = serverPermissions[roleIndex];

    if (serverRole.roleName === "Admin") continue;

    const savedRole = updatedPermissions.find((role) => role.roleId === serverRole.roleId);

    if (!savedRole) continue;

    for (let permissionIndex = 0; permissionIndex < serverRole.permissions.length; permissionIndex++) {
      const serverPermission = serverRole.permissions[permissionIndex];

      const comparedPermission = savedRole?.permissions.find(
        (permission) =>
          permission.actionId === serverPermission.actionId &&
          permission.resourceId === serverPermission.resourceId &&
          permission.permit !== serverPermission.permit,
      );
      if (comparedPermission) {
        updateList.push({
          roleId: savedRole.roleId,
          actionId: comparedPermission.actionId,
          resourceId: comparedPermission.resourceId,
          permit: comparedPermission.permit,
        });
      }
    }
  }

  return updateList;
}

/*
function getDistinctResources(permissionSets: IPermissionSet[]) {
  const resourceActions: {
    resourceId: string;
    resourceName: string;
    actions: { actionId: string; actionName: string }[];
  }[] = [];

  permissionSets.forEach((permissionSet) => {
    permissionSet.permissions.map((permission) => {
      let element = resourceActions.find((item) => item.resourceId === permission.resourceId);

      if (!element) {
        element = { resourceId: permission.resourceId, resourceName: permission.resource, actions: [] };
        resourceActions.push(element);
      }

      if (!element.actions.some((action) => action.actionId === permission.actionId)) {
        element.actions.push({ actionId: permission.actionId, actionName: permission.action });
      }
    });
  });

  return resourceActions;
}
*/
