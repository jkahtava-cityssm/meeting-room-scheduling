"use client";

import { useEffect, useState, Fragment, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissionsQuery } from "@/lib/services/permissions";
import { IPermissionSet } from "@/lib/data/permissions";

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
      next: boolean | "indeterminate"
    ) => {
      if (!workingPermissions) return;
      const isChecked = next === true;
      setWorkingPermissions((prev) =>
        prev ? setPermit(prev, roleId, resourceId, resourceName, actionId, actionName, isChecked) : prev
      );
    },
    [workingPermissions]
  );

  if (isLoading || error || !workingPermissions || !resourceActions) {
    return <>...Loading</>;
  }
  console.log(workingPermissions);

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto max-w-full">
          <Table className="w-auto min-w-[700px] table-fixed">
            <colgroup>
              {/* First column: Resource / Action */}
              <col style={{ minWidth: "220px" }} />
              {/* One <col> per role; you can fix or let them auto */}
              {workingPermissions.map((permissionSet) => (
                <col
                  key={permissionSet.roleId}
                  style={{ minWidth: "180px" }} /* auto width or set a fixed %/px if you prefer */
                />
              ))}
            </colgroup>

            {/* Header */}
            <TableHeader className="">
              <TableRow className="bg-background hover:bg-background border-0 ">
                <TableHead className="">Action</TableHead>
                {workingPermissions.map((permissionSet) => (
                  <TableHead key={permissionSet.roleId} className="text-center ">
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
                      <TableCell colSpan={workingPermissions.length + 1} className="font-semibold">
                        {resourceAction.resourceName}
                      </TableCell>
                    </TableRow>

                    {/* Actions for resource */}
                    {resourceAction.actions.map((action) => (
                      <TableRow key={`${resourceAction.resourceId}:${action.actionId}`} className="border-t">
                        {/* Action label */}
                        <TableCell className="font-medium ">{action.actionName}</TableCell>

                        {/* One cell per role */}
                        {workingPermissions.map((permissionSet) => {
                          const isAllowed = permissionSet.permissions.some(
                            (t) =>
                              t.actionId === action.actionId &&
                              t.resourceId === resourceAction.resourceId &&
                              t.permit === true
                          ); //!!permissions[k];

                          return (
                            <TableCell
                              key={`${permissionSet.roleId}:${resourceAction.resourceId}:${action.actionId}`}
                              className="text-center "
                            >
                              <div className="flex flex-col items-center gap-1">
                                {/* Toggle */}
                                <Checkbox
                                  disabled={permissionSet.roleName === "Admin" || permissionSet.roleName === "Public"}
                                  checked={isAllowed}
                                  onCheckedChange={(next) =>
                                    onToggle(
                                      permissionSet.roleId,
                                      resourceAction.resourceId,
                                      resourceAction.resourceName,
                                      action.actionId,
                                      action.actionName,
                                      next
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
        </CardContent>
      </Card>
    </TooltipProvider>
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
  nextValue: boolean
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
