import { NextRequest } from "next/server";

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { findManyExpandedPermissionSets, findManyResourceAction } from "@/lib/data/permissions";
import { guardRoute } from "@/lib/api-guard";
import { prisma } from "@/prisma";

export async function GET(req: NextRequest) {
  return guardRoute(
    req,

    { EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" } },
    async (sessionUserId, permissionCache, permissions, sessionId) => {
      const permissionSets = await findManyExpandedPermissionSets();

      if (!permissionSets) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("PermissionSets Found", permissionSets);
    },
  );
}

type rolePermissionMutations = {
  roleId: string;
  actionId: string;
  resourceId: string;
  permit: boolean;
};

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,
    {
      EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" },
    },
    async () => {
      const permissionList: rolePermissionMutations[] = await request.json();
      //{ data: permissionList }: { data: rolePermissionMutations[] }
      if (!permissionList) {
        return BadRequestMessage();
      }

      if (permissionList.length === 0) {
        return BadRequestMessage();
      }

      const distinctResourceActionList = Array.from(
        new Map(
          permissionList.map((item) => [
            `${item.resourceId}-${item.actionId}`,
            { resourceId: Number(item.resourceId), actionId: Number(item.actionId) },
          ]),
        ).values(),
      );

      const resourceActions = await findManyResourceAction({
        OR: distinctResourceActionList.map((element) => ({
          resourceId: element.resourceId,
          actionId: element.actionId,
        })),
      });
      const resourceActionLookup = new Map(
        resourceActions.map((resourceAction) => [
          `${resourceAction.resourceId}-${resourceAction.actionId}`,
          resourceAction.resourceActionId,
        ]),
      );

      try {
        const results = await prisma.$transaction(
          permissionList.map((p) => {
            const resourceActionId = resourceActionLookup.get(`${p.resourceId}-${p.actionId}`);
            if (!resourceActionId) throw new Error(`Mapping not found for Res:${p.resourceId} Act:${p.actionId}`);

            return prisma.roleResourceAction.upsert({
              where: {
                roleId_resourceActionId: {
                  roleId: Number(p.roleId),
                  resourceActionId: resourceActionId,
                },
              },
              update: { permit: p.permit },
              create: {
                roleId: Number(p.roleId),
                resourceActionId: resourceActionId,
                permit: p.permit,
              },
            });
          }),
        );

        return SuccessMessage("Updated Permissions", results);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return BadRequestMessage(message);
      }
    },
  );
}
