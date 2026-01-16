import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { Role } from "../auth";
import z from "zod/v4";
import { ROLES_ENUM } from "../types";

export const SPermission = z.object({
  permissionId: z.string(),
  permit: z.boolean(),
  actionId: z.string(),
  action: z.string(),
  resourceId: z.string(),
  resource: z.string(),
});
export const SPermissionSet = z.object({ roleId: z.string(), roleName: z.string(), permissions: z.array(SPermission) });

export type IPermission = z.infer<typeof SPermission>;
export type IPermissionSet = z.infer<typeof SPermissionSet>;

const PERMISSION_SET_SELECT = {
  roleResourceAction: { include: { resourceAction: { include: { resource: true, action: true } } } },
} as const satisfies Prisma.RoleInclude;

export async function findManyExpandedPermissionSets(
  where?: Prisma.RoleWhereInput,
): Promise<IPermissionSet[] | undefined> {
  const roles = await prisma.role.findMany({ where, include: PERMISSION_SET_SELECT });
  const allResourceActions = await prisma.resourceAction.findMany({
    include: { resource: true, action: true },
  });

  console.log("Roles fetched:", roles);
  return roles?.map((role) => {
    return {
      roleId: String(role.roleId),
      roleName: role.name,
      permissions: allResourceActions.map((resourceAction) => {
        const permissionInRole = role.roleResourceAction.find(
          (pa) => pa.resourceActionId === resourceAction.resourceActionId || role.name === ROLES_ENUM.Admin,
        );

        return {
          permissionId: String(permissionInRole ? permissionInRole.roleResourceActionId : "-1"),
          permit: permissionInRole ? permissionInRole.permit : false,
          actionId: String(resourceAction.actionId),
          action: resourceAction.action.name,
          resourceId: String(resourceAction.resourceId),
          resource: resourceAction.resource.name,
        };
      }),
    };
  });
}

//Role Schema and Type
export const SRole = z.object({
  roleId: z.number(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IRole = z.infer<typeof SRole>;

const ROLE_SELECT = {
  roleId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.RoleSelect;

export async function findManyRoles(where?: Prisma.RoleWhereInput) {
  const roles = await prisma.role.findMany({ where, select: ROLE_SELECT });

  return roles;
}
