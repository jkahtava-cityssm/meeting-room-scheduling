"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

// --- Types (adjust to your app) ---
export type Role = {
  roleId: number;
  name: string;
};

export type Resource = {
  resourceId: number;
  name: string; // e.g., "Events", "Rooms"
};

export type Action = {
  actionId: number;
  name: string; // e.g., "create" | "read" | "update" | "delete"
};

export type PermissionCellKey = {
  roleId: number;
  resourceId: number;
  actionId: number;
};

// Backing data (boolean per cell); key format: `${roleId}:${resourceId}:${actionId}`
export type PermissionMap = Record<string, boolean>;

type PermissionGridProps = {
  roles: Role[];
  resources: Resource[];
  actionsByResource: Record<number, Action[]>; // resourceId -> Action[]
  permissions: PermissionMap;
  onToggle: (key: PermissionCellKey, nextValue: boolean) => void;
  yesLabel?: string; // default YES
  noLabel?: string; // default NO
  // Optional: show tips on hover to explain permission
  tooltipForDenied?: string; // e.g., "Ask an admin for access"
};

const cellKey = (k: PermissionCellKey) => `${k.roleId}:${k.resourceId}:${k.actionId}`;

export function PermissionGrid({
  roles,
  resources,
  actionsByResource,
  permissions,
  onToggle,
  yesLabel = "YES",
  noLabel = "NO",
  tooltipForDenied = "Insufficient permissions",
}: PermissionGridProps) {
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
              {roles.map((_, i) => (
                <col key={i} style={{ minWidth: "180px" }} /* auto width or set a fixed %/px if you prefer */ />
              ))}
            </colgroup>

            {/* Header */}
            <TableHeader className="">
              <TableRow className="bg-background hover:bg-background border-0 ">
                <TableHead className="">Action</TableHead>
                {roles.map((role) => (
                  <TableHead key={role.roleId} className="text-center ">
                    {role.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {resources.map((res) => {
                const resActions = actionsByResource[res.resourceId] ?? [];
                return (
                  <React.Fragment key={res.resourceId}>
                    {/* Resource Title Row */}
                    <TableRow className="bg-muted hover:bg-muted border ">
                      <TableCell colSpan={roles.length + 1} className="font-semibold">
                        {res.name}
                      </TableCell>
                    </TableRow>

                    {/* Actions for resource */}
                    {resActions.map((act) => (
                      <TableRow key={`${res.resourceId}:${act.actionId}`} className="border-t">
                        {/* Action label */}
                        <TableCell className="font-medium ">{act.name}</TableCell>

                        {/* One cell per role */}
                        {roles.map((role) => {
                          const keyObj: PermissionCellKey = {
                            roleId: role.roleId,
                            resourceId: res.resourceId,
                            actionId: act.actionId,
                          };
                          const k = cellKey(keyObj);
                          const isAllowed = !!permissions[k];

                          return (
                            <TableCell key={k} className="text-center ">
                              <div className="flex flex-col items-center gap-1">
                                {/* Toggle */}
                                <Checkbox
                                  checked={isAllowed}
                                  onCheckedChange={(next) => onToggle(keyObj, next === true)}
                                  aria-label={`${res.name}:${act.name} for ${role.name} = ${
                                    isAllowed ? yesLabel : noLabel
                                  }`}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
