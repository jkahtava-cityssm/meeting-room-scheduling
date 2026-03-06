import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { Role } from "../auth";
import z from "zod/v4";
import { ROLES_ENUM, SessionAction, SessionResource, SessionRole } from "../types";

export const SPermission = z.object({
  permissionId: z.string(),
  permit: z.union([z.boolean(), z.stringbool()]),
  actionId: z.string(),
  action: z.string(),
  resourceId: z.string(),
  resource: z.string(),
});
export const SPermissionSet = z.object({ roleId: z.string(), roleName: z.string(), permissions: z.array(SPermission) });

export type IPermission = z.infer<typeof SPermission>;
export type IPermissionSet = z.infer<typeof SPermissionSet>;

const RESOURCE_ACTION = {
  resource: true,
  action: true,
} as const satisfies Prisma.ResourceActionInclude;

const ROLE_RESOURCE_ACTION = {
  resourceAction: { include: RESOURCE_ACTION },
} as const satisfies Prisma.RoleResourceActionInclude;

const PERMISSION_SET_SELECT = {
  roleResourceAction: { include: ROLE_RESOURCE_ACTION },
} as const satisfies Prisma.RoleInclude;

export async function findManyExpandedPermissionSets(
  where?: Prisma.RoleWhereInput,
  tx: Prisma.TransactionClient = prisma,
): Promise<IPermissionSet[] | undefined> {
  const roles = await tx.role.findMany({ where, include: PERMISSION_SET_SELECT, orderBy: { roleId: "asc" } });
  const allResourceActions = await tx.resourceAction.findMany({
    include: { resource: true, action: true },
    orderBy: { resourceActionId: "asc" },
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

const USER_ROLE_SELECT = {
  name: true,
  roleId: true,
  roleResourceAction: { include: { resourceAction: { include: { resource: true, action: true } } } },
} as const satisfies Prisma.RoleSelect;

export async function findManyRoles(where?: Prisma.RoleWhereInput, tx: Prisma.TransactionClient = prisma) {
  const roles = await tx.role.findMany({ where, select: ROLE_SELECT, orderBy: { roleId: "asc" } });

  return roles;
}
async function findManyUserRoles(where?: Prisma.RoleWhereInput, tx: Prisma.TransactionClient = prisma) {
  const roles = await tx.role.findMany({ where, select: USER_ROLE_SELECT, orderBy: { roleId: "asc" } });

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
  return await findManyUserRoles({ userRole: { some: { userId, granted: true } } });
}

export async function upsertRoleResourceAction(
  params: {
    where: Prisma.RoleResourceActionWhereUniqueInput;
    create: Prisma.RoleResourceActionCreateInput;
    update: Prisma.RoleResourceActionUpdateInput;
  },
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.roleResourceAction.upsert({
    where: params.where,
    create: params.create,
    update: params.update,
    include: ROLE_RESOURCE_ACTION,
  });
}

const RESOURCE_ACTION_SELECT = {
  resourceActionId: true,
  resourceId: true,
  resource: true,
  actionId: true,
  action: true,
} as const satisfies Prisma.ResourceActionSelect;

export async function findManyResourceAction(
  where?: Prisma.ResourceActionWhereInput,
  tx: Prisma.TransactionClient = prisma,
) {
  const resourceActions = await tx.resourceAction.findMany({
    where,
    select: RESOURCE_ACTION_SELECT,
    orderBy: { resourceActionId: "asc" },
  });

  return resourceActions;
}

export async function upsertResourceAction(
  params: {
    where: Prisma.ResourceActionWhereUniqueInput;
    create: Prisma.ResourceActionCreateInput;
    update: Prisma.ResourceActionUpdateInput;
  },
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.resourceAction.upsert({
    where: params.where,
    create: params.create,
    update: params.update,
    include: RESOURCE_ACTION,
  });
}
