import { Fragment } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { IPermissionSet } from "@/lib/data/permissions";
import { ResourceActions } from "./permission-layout";
import { Button } from "@/components/ui/button";

interface PermissionTableWithActionsProps {
  workingPermissions: IPermissionSet[];
  serverPermissions: IPermissionSet[]; // Needed for Reset/Cancel logic
  resourceActions: ResourceActions[]; // Replace with your ResourceActions type
  isChanged: boolean;
  onToggle: (
    roleId: string,
    resourceId: string,
    resourceName: string,
    actionId: string,
    actionName: string,
    next: boolean,
  ) => void;
  onSave: (
    differences: {
      roleId: string;
      actionId: string;
      resourceId: string;
      permit: boolean;
    }[],
  ) => void;
  onReset: (original: IPermissionSet[]) => void;
  yesLabel?: string;
  noLabel?: string;
}

export function RolePermissionGrid({
  workingPermissions,
  serverPermissions,
  resourceActions,
  isChanged,
  onToggle,
  onReset,
  onSave,
  yesLabel = "YES",
  noLabel = "NO",
}: PermissionTableWithActionsProps) {
  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <ScrollArea className="h-full w-full  pr-4" type="always">
          <TooltipProvider>
            <Table className="w-auto min-h-0 table-fixed">
              <colgroup>
                <col style={{ minWidth: "fit-content" }} />
                {workingPermissions.map((permissionSet) => (
                  <col key={permissionSet.roleId} style={{ minWidth: "fit-content" }} />
                ))}
              </colgroup>

              <TableHeader className="shadow-lg">
                <TableRow className="bg-background hover:bg-background border-none">
                  <TableHead className="pr-4">Action</TableHead>
                  {workingPermissions.map((permissionSet) => (
                    <TableHead key={permissionSet.roleId} className="text-center px-4">
                      {permissionSet.roleName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {resourceActions.map((resourceAction) => (
                  <Fragment key={resourceAction.resourceId}>
                    <TableRow className="bg-muted hover:bg-muted border">
                      <TableCell colSpan={workingPermissions.length + 1} className="font-semibold pr-4">
                        {resourceAction.resourceName}
                      </TableCell>
                    </TableRow>

                    {resourceAction.actions.map((action) => (
                      <TableRow key={`${resourceAction.resourceId}:${action.actionId}`} className="border-t">
                        <TableCell className="font-medium px-4">{action.actionName}</TableCell>
                        {workingPermissions.map((permissionSet) => {
                          const isAllowed = permissionSet.permissions.some(
                            (t) =>
                              t.actionId === action.actionId &&
                              t.resourceId === resourceAction.resourceId &&
                              t.permit === true,
                          );

                          return (
                            <TableCell
                              key={`${permissionSet.roleId}:${resourceAction.resourceId}:${action.actionId}`}
                              className="text-center"
                            >
                              <div className="flex flex-col items-center gap-1">
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
                                      Boolean(next),
                                    )
                                  }
                                  aria-label={`${resourceAction.resourceName}:${action.actionName} for ${permissionSet.roleName}`}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
          <ScrollBar orientation="vertical" forceMount />
        </ScrollArea>
      </div>

      {/* Grid-specific Footer */}
      <footer className="flex h-14 items-center border-t  px-4 shrink-0">
        <div className="flex w-full items-center justify-end gap-2">
          <Button disabled={!isChanged} variant="ghost" onClick={() => onReset(structuredClone(serverPermissions))}>
            Cancel
          </Button>
          <Button
            disabled={!isChanged}
            onClick={() => {
              const differences = getDifferences(serverPermissions, workingPermissions);
              onSave(differences);
            }}
          >
            Save Changes
          </Button>
        </div>
      </footer>
    </div>
  );
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
