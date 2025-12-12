import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { Role } from "../auth";
import z from "zod/v4";

export const SPermission = z.object({
  permissionId: z.string(),
  permit: z.boolean(),
  actionId: z.string(),
  action: z.string(),
  resourceId: z.string(),
  resource: z.string(),
});
export const SRole = z.object({ name: z.string(), roleId: z.string(), permissions: z.array(SPermission) });

export type IRole = z.infer<typeof SRole>;

const TEST = {
  roleResourceAction: { include: { resource: true, action: true } },
} as const satisfies Prisma.RoleInclude;

export async function findManyRoles(where?: Prisma.RoleWhereInput): Promise<IRole[] | undefined> {
  const roles = await prisma.role.findMany({ where, include: TEST });

  return roles?.map((role) => {
    return {
      name: role.name,
      roleId: String(role.roleId),
      permissions: role.roleResourceAction.map((permission) => {
        return {
          permissionId: String(permission.roleResourceActionId),
          permit: permission.permit,
          actionId: String(permission.actionId),
          action: permission.action.name,
          resourceId: String(permission.resourceId),
          resource: permission.resource.name,
        };
      }),
    };
  });
}
