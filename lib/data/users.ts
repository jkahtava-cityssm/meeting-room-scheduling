import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";
import { SUser } from "../schemas";
import z from "zod/v4";

// Standard user select configuration — used across all DAL functions
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  department: true,
  jobTitle: true,
  employeeNumber: true,
  employeeActive: true,
  isExternal: true,
  receiveEmails: true,
} as const satisfies Prisma.UserSelect;

const USER_ROLE_SELECT = {
  roleId: true,
  granted: true,
  role: { select: { name: true } },
} as const satisfies Prisma.UserRoleSelect;

export async function findManyUsers(where?: Prisma.UserWhereInput, tx: Prisma.TransactionClient = prisma) {
  const userList = await tx.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: [{ name: "asc" }, { email: "asc" }, { id: "asc" }],
  });
  if (!userList || userList.length === 0) {
    return [];
  }

  return userList.map((user) => {
    mapBaseUser(user);
  });
}

export async function findManyUsersWithRoles(
  roleId?: number,
  where?: Prisma.UserWhereInput,
  tx: Prisma.TransactionClient = prisma,
) {
  const userList = await tx.user.findMany({
    where,
    select: { ...USER_SELECT, userRole: { where: roleId ? { roleId } : undefined, select: { ...USER_ROLE_SELECT } } },
    orderBy: [{ name: "asc" }, { email: "asc" }, { id: "asc" }],
  });
  if (!userList || userList.length === 0) {
    return [];
  }

  const defaultRole = await getDefaultRole();

  return userList.map((user) => {
    const roleList = user.userRole.map((userRole) => {
      return { roleId: userRole.roleId, name: userRole.role.name, granted: userRole.granted };
    });

    const hasDefaultRole = roleList.some((role) => role.roleId === defaultRole.roleId);

    if (defaultRole.roleId && !hasDefaultRole) {
      roleList.push({ roleId: defaultRole.roleId, name: defaultRole.name ?? "Default Role", granted: true });
    }

    return {
      ...mapBaseUser(user),
      roles: roleList,
    };
  });
}

export async function getDefaultRole(
  tx: Prisma.TransactionClient = prisma,
): Promise<{ roleId: number | null; name: string | null }> {
  const defaultRole = await tx.configuration.findFirst({
    where: { key: "defaultUserRole" },
    orderBy: { configurationId: "asc" },
  });

  const defaultRoleID = Number(defaultRole?.value);
  if (!Number.isFinite(defaultRoleID)) {
    console.warn("Default role ID is not set or invalid. Skipping default role assignment.");
    return { roleId: null, name: null };
  }

  const role = await tx.role.findUnique({
    where: { roleId: defaultRoleID },
    select: { roleId: true, name: true },
  });

  return role ? { roleId: role.roleId, name: role.name } : { roleId: null, name: null };
}

export async function upsertUser(
  params: {
    where: Prisma.UserWhereUniqueInput;
    create: Prisma.UserCreateInput;
    update: Prisma.UserUpdateInput;
  },
  tx: Prisma.TransactionClient = prisma,
) {
  const user = await tx.user.upsert({
    where: params.where,
    create: params.create,
    update: params.update,
    select: USER_SELECT,
  });

  return mapBaseUser(user);
}

export async function createUser(data: Prisma.UserCreateInput, tx: Prisma.TransactionClient = prisma) {
  const user = await tx.user.create({ data, select: USER_SELECT });

  return mapBaseUser(user);
}

export async function deleteManyUsers(where?: Prisma.UserWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.user.deleteMany({
    where,
  });
}

type UserWithRelations = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

function mapBaseUser(user: UserWithRelations) {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    jobTitle: user.jobTitle,
    employeeNumber: user.employeeNumber,
    employeeActive: user.employeeActive,
    isExternal: user.isExternal,
    receiveEmail: user.receiveEmails,
  };
}
