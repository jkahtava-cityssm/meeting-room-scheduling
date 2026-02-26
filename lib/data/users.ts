import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

// Standard user select configuration — used across all DAL functions
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  department: true,
  jobTitle: true,
  employeeNumber: true,
  employeeActive: true,
} as const satisfies Prisma.UserSelect;

// Standard session select configuration — used across all DAL functions
const SESSION_SELECT = {
  userId: true,
  expiresAt: true,
} as const satisfies Prisma.SessionSelect;

const USER_ROLE_SELECT = {
  roleId: true,
  granted: true,
  role: { select: { name: true } },
} as const satisfies Prisma.UserRoleSelect;

export async function findManyUsers(where?: Prisma.UserWhereInput, tx: Prisma.TransactionClient = prisma) {
  const userList = await tx.user.findMany({ where, select: USER_SELECT });
  if (!userList || userList.length === 0) {
    return [];
  }

  return userList.map((user) => {
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      jobTitle: user.jobTitle,
      employeeNumber: user.employeeNumber,
      employeeActive: user.employeeActive,
    };
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
    orderBy: { name: "asc" },
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
      userId: user.id,
      name: user.name,
      email: user.email,
      department: user.department ?? "No Department",
      jobTitle: user.jobTitle,
      employeeNumber: user.employeeNumber,
      employeeActive: user.employeeActive,
      roles: roleList,
    };
  });
}

export async function getDefaultRole(
  tx: Prisma.TransactionClient = prisma,
): Promise<{ roleId: number | null; name: string | null }> {
  const defaultRole = await tx.configuration.findFirst({ where: { key: "defaultUserRole" } });

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

export async function findSession(where: Prisma.SessionWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.session.findFirst({ where, select: SESSION_SELECT });
}
