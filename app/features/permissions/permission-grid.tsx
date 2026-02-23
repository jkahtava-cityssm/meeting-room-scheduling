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
import { GenericSelect } from "@/components/shared/GenericSelect";
import { Input } from "@/components/ui/input";
import { PermissionList } from "./permission-left-column";
import { Employee, generateEmployees, PermissionGroupList } from "./permission-table";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ResourceActions = {
  resourceId: string;
  resourceName: string;
  actions: {
    actionId: string;
    actionName: string;
  }[];
};

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
      setChanged(true);
      const isChecked = next === true;
      setWorkingPermissions((prev) =>
        prev ? setPermit(prev, roleId, resourceId, resourceName, actionId, actionName, isChecked) : prev,
      );
    },
    [],
  );

  const putPermission = usePermissionMutationUpsert();

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading || error || !workingPermissions || !resourceActions) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="h-full md:hidden">
        <Tabs defaultValue="list" className="flex flex-col h-full">
          <div className="px-4 py-2 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Permissions</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="list" className="flex-1 overflow-auto m-0">
            <PermissionList
              workingPermissions={workingPermissions}
              serverPermissions={serverPermissions ?? []}
              resourceActions={resourceActions ?? []}
              isChanged={isChanged}
              onToggle={onToggle}
              onReset={(original) => {
                setWorkingPermissions(original);
                setChanged(false);
              }}
              onSave={(diffs) => {
                putPermission.mutate(diffs, {
                  onSuccess: () => setChanged(false),
                });
              }}
            />
          </TabsContent>
          <TabsContent value="roles" className="flex-1 overflow-auto m-0">
            <PermissionGroupList onToggleAssigned={(id, next) => console.log("Assigning", id, next)} />
          </TabsContent>
        </Tabs>
      </div>
      <div className="hidden md:flex h-full">
        <div className="flex border-r overflow-auto">
          <PermissionList
            workingPermissions={workingPermissions}
            serverPermissions={serverPermissions ?? []}
            resourceActions={resourceActions ?? []}
            isChanged={isChanged}
            onToggle={onToggle}
            onReset={(original) => {
              setWorkingPermissions(original);
              setChanged(false);
            }}
            onSave={(diffs) => {
              putPermission.mutate(diffs, {
                onSuccess: () => setChanged(false),
              });
            }}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <PermissionGroupList onToggleAssigned={(id, next) => console.log("Assigning", id, next)} />
        </div>
      </div>
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
