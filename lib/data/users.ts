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
  role: { select: { name: true } },
} as const satisfies Prisma.UserRoleSelect;

export async function findManyUsers(where?: Prisma.UserWhereInput) {
  const userList = await prisma.user.findMany({ where, select: USER_SELECT });
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

export async function findManyUsersWithRoles(roleId?: number, where?: Prisma.UserWhereInput) {
  const userList = await prisma.user.findMany({
    where,
    select: { ...USER_SELECT, userRole: { where: roleId ? { roleId } : undefined, select: { ...USER_ROLE_SELECT } } },
    orderBy: { name: "asc" },
  });
  if (!userList || userList.length === 0) {
    return [];
  }

  return userList.map((user) => {
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      department: user.department ?? "No Department",
      jobTitle: user.jobTitle,
      employeeNumber: user.employeeNumber,
      employeeActive: user.employeeActive,
      roles: user.userRole.map((userRole) => {
        return { roleId: userRole.roleId, name: userRole.role.name };
      }),
    };
  });
}

export async function findSession(where: Prisma.SessionWhereInput) {
  return prisma.session.findFirst({ where, select: SESSION_SELECT });
}
