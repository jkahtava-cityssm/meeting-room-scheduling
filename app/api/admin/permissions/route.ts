import { NextRequest } from 'next/server';

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { findManyExpandedPermissionSets, findManyResourceAction, upsertRoleResourceAction } from '@/lib/data/permissions';
import { guardRoute } from '@/lib/api-guard';

export async function GET(req: NextRequest) {
  return guardRoute(
    req,

    { EditPermission: { type: 'permission', resource: 'Settings', action: 'Edit Permissions' } },
    async () => {
      const permissionSets = await findManyExpandedPermissionSets();

      if (!permissionSets) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('PermissionSets Found', permissionSets);
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
      EditPermission: { type: 'permission', resource: 'Settings', action: 'Edit Permissions' },
    },
    async ({ sessionUserId }) => {
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
        resourceActions.map((resourceAction) => [`${resourceAction.resourceId}-${resourceAction.actionId}`, resourceAction.resourceActionId]),
      );

      try {
        const results = [];

        for (const p of permissionList) {
          const resourceActionId = resourceActionLookup.get(`${p.resourceId}-${p.actionId}`);

          if (!resourceActionId) {
            // Log the missing mapping, but keep the loop going so other permissions succeed
            console.error(`Mapping not found for Res:${p.resourceId} Act:${p.actionId}`);
            continue;
          }

          try {
            const result = await upsertRoleResourceAction(Number(p.roleId), resourceActionId, p.permit, sessionUserId);
            results.push(result);
          } catch (error) {
            console.error(`Failed to upsert permission for Res:${p.resourceId} Act:${p.actionId}:`, error);
          }
        }

        return SuccessMessage('Updated Permissions', results);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return BadRequestMessage(message);
      }
    },
  );
}
