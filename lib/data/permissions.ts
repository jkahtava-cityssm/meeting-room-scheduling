import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { Role } from "../auth";
import z from "zod/v4";
import { ROLES_ENUM, SessionAction, SessionResource, SessionRole } from "../types";

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

  return roles?.map((role) => {
    return {
      roleId: String(role.roleId),
      roleName: role.name,
      permissions: allResourceActions.map((resourceAction) => {
        const permissionInRole = role.roleResourceAction.find(
          (pa) => pa.resourceActionId === resourceAction.resourceActionId,
        );

        const permissionExists = permissionInRole ? permissionInRole.permit : false;
        const permit = role.name === ROLES_ENUM.Admin ? true : permissionExists;

        return {
          permissionId: String(permissionInRole ? permissionInRole.roleResourceActionId : "-1"),
          permit: permit,
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

const USER_ROLE_SELECT = {
  name: true,
  roleId: true,
  roleResourceAction: { include: { resourceAction: { include: { resource: true, action: true } } } },
} as const satisfies Prisma.RoleSelect;

async function findManyUserRoles(where?: Prisma.RoleWhereInput) {
  const roles = await prisma.role.findMany({ where, select: USER_ROLE_SELECT });

  if (!roles || roles.length === 0) {
    return [];
  }

  return roles
    .map((userRole) => {
      return {
        roleId: userRole.roleId,
        name: userRole.name as SessionRole,
        permissions: userRole.roleResourceAction
          .map((permission) => {
            const ra = permission.resourceAction;
            return {
              permit: permission.permit,
              action: ra.action.name as SessionAction,
              resource: ra.resource.name as SessionResource,
            };
          })
          .sort((a, b) =>
            a.resource === b.resource ? a.action.localeCompare(b.action) : a.resource.localeCompare(b.resource),
          ),
      };
    })
    .sort((a, b) => a.roleId - b.roleId);
}

export async function getRolesByName(name: string) {
  return await findManyUserRoles({ name });
}

export async function getRolesByUserId(userId: number) {
  return await findManyUserRoles({ userRole: { some: { userId } } });
}
