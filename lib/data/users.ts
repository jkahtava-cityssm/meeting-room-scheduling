import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';

// Standard user select configuration — used across all DAL functions
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  department: true,
  jobTitle: true,
  externalId: true,
  isActive: true,
  isManaged: true,
  emailEnabled: true,
} as const satisfies Prisma.UserSelect;

const USER_ROLE_SELECT = {
  roleId: true,
  granted: true,
  role: { select: { name: true } },
} as const satisfies Prisma.UserRoleSelect;

export async function findFirstUser(where?: Prisma.UserWhereInput, tx: Prisma.TransactionClient = prisma) {
  const user = await tx.user.findFirst({
    where,
    select: USER_SELECT,
    orderBy: [{ name: 'asc' }, { email: 'asc' }, { id: 'asc' }],
  });

  if (!user) return null;

  return mapBaseUser(user);
}

export async function findManyUsers(where?: Prisma.UserWhereInput, tx: Prisma.TransactionClient = prisma) {
  const userList = await tx.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: [{ name: 'asc' }, { email: 'asc' }, { id: 'asc' }],
  });
  if (!userList || userList.length === 0) {
    return [];
  }

  return userList.map((user) => {
    return mapBaseUser(user);
  });
}

export async function findManyUsersWithRoles(roleId?: number, where?: Prisma.UserWhereInput, tx: Prisma.TransactionClient = prisma) {
  const userList = await tx.user.findMany({
    where,
    select: { ...USER_SELECT, userRole: { where: roleId ? { roleId } : undefined, select: { ...USER_ROLE_SELECT } } },
    orderBy: [{ name: 'asc' }, { email: 'asc' }, { id: 'asc' }],
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
      roleList.push({ roleId: defaultRole.roleId, name: defaultRole.name ?? 'Default Role', granted: true });
    }

    return {
      ...mapBaseUser(user),
      roles: roleList,
    };
  });
}

export async function upsertUserRole(
  data: { userId: number; roleId: number; granted: boolean },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const contextInfo = `[TargetUserId: ${data.userId}, RoleId: ${data.roleId}, User: ${sessionUserId}]`;

  try {
    // 1. Optimistically try to create the user role relation first
    return await tx.userRole.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
        granted: data.granted,
        createdBy: sessionUserId,
        updatedBy: sessionUserId,
      },
    });
  } catch (err) {
    // 2. Handle known database errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        try {
          // 3. Conflict found (already exists), fall back to update using the compound key
          return await tx.userRole.update({
            where: {
              userId_roleId: {
                userId: data.userId,
                roleId: data.roleId,
              },
            },
            data: {
              granted: data.granted,
              updatedBy: sessionUserId,
            },
          });
        } catch (updateErr) {
          console.error(`[UserRole] Concurrency fallback update failed for ${contextInfo}:`, updateErr);
          throw new Error(`Failed to update existing user role configuration for ${contextInfo}`, { cause: updateErr });
        }
      }

      console.error(`[UserRole] Database error during initial create ${contextInfo}:`, err);
      throw new Error(`Database error while saving user role (Prisma code: ${err.code})`, { cause: err });
    }

    // 4. Handle unexpected/generic errors
    console.error(`[UserRole] Unexpected error during upsertUserRole ${contextInfo}:`, err);
    throw new Error(`An unexpected error occurred while saving user role mapping`, { cause: err });
  }
}

export async function createUserRole(
  data: { userId: number; roleId: number; granted: boolean },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const userRole = await tx.userRole.create({
    data: { userId: data.userId, roleId: data.roleId, granted: data.granted, createdBy: sessionUserId, updatedBy: sessionUserId },
  });

  return userRole;
}

export async function getDefaultRole(tx: Prisma.TransactionClient = prisma): Promise<{ roleId: number | null; name: string | null }> {
  const defaultRole = await tx.configuration.findFirst({
    where: { key: 'defaultUserRole' },
    orderBy: { configurationId: 'asc' },
  });

  const defaultRoleID = Number(defaultRole?.value);
  if (!Number.isFinite(defaultRoleID)) {
    console.warn('Default role ID is not set or invalid. Skipping default role assignment.');
    return { roleId: null, name: null };
  }

  const role = await tx.role.findUnique({
    where: { roleId: defaultRoleID },
    select: { roleId: true, name: true },
  });

  return role ? { roleId: role.roleId, name: role.name } : { roleId: null, name: null };
}

export async function upsertUser(
  data: {
    userId?: number;
    name: string;
    email: string;
    isActive: boolean;
    isManaged: boolean;
    emailEnabled: boolean;
    department?: string;
    jobTitle?: string;
    externalId?: string;
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const contextInfo = `[TargetUserId: ${data.userId ?? 'NEW'}, Email: ${data.email}, ModifierUser: ${sessionUserId}]`;

  // Shared mutation payload mapping
  const sharedData = {
    name: data.name,
    email: data.email,
    isActive: data.isActive,
    isManaged: data.isManaged,
    emailEnabled: data.emailEnabled,
    department: data.department,
    jobTitle: data.jobTitle,
    externalId: data.externalId,
    updatedBy: sessionUserId,
  };

  // Scenario A: No userId provided means it is explicitly a brand new user
  if (!data.userId) {
    try {
      const user = await tx.user.create({
        data: {
          ...sharedData,
          createdBy: sessionUserId,
        },
        select: USER_SELECT,
      });
      return mapBaseUser(user);
    } catch (err) {
      console.error(`[User] Failed to create new user profile ${contextInfo}:`, err);
      throw new Error(`Database error encountered while creating new user profile`, { cause: err });
    }
  }

  // Scenario B: UserId exists, execute the concurrency-safe update-first strategy
  try {
    // Optimistically assume the user profile exists and update it via 'id'
    const user = await tx.user.update({
      where: { id: data.userId },
      data: sharedData,
      select: USER_SELECT,
    });
    return mapBaseUser(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record to update not found (race condition catch window)
      if (err.code === 'P2025') {
        try {
          const user = await tx.user.create({
            data: {
              ...sharedData,
              createdBy: sessionUserId,
            },
            select: USER_SELECT,
          });
          return mapBaseUser(user);
        } catch (createErr) {
          console.error(`[User] Concurrency fallback create failed for ${contextInfo}:`, createErr);
          throw new Error(`Failed to create user record after missing update check`, { cause: createErr });
        }
      }

      console.error(`[User] Database error during update ${contextInfo}:`, err);
      throw new Error(`Database error while updating user configurations (Prisma code: ${err.code})`, { cause: err });
    }

    // Handle unexpected/generic errors
    console.error(`[User] Unexpected error during upsertUser ${contextInfo}:`, err);
    throw new Error(`An unexpected error occurred while saving user data`, { cause: err });
  }
}

export async function createUser(
  data: {
    name: string;
    email: string;
    isActive: boolean;
    isManaged: boolean;
    emailEnabled: boolean;
    department?: string;
    jobTitle?: string;
    externalId?: string;
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const user = await tx.user.create({
    data: {
      name: data.name,
      email: data.email,
      isActive: data.isActive,
      isManaged: data.isManaged,
      emailEnabled: data.emailEnabled,
      department: data.department,
      jobTitle: data.jobTitle,
      externalId: data.externalId,
      createdBy: sessionUserId,
      updatedBy: sessionUserId,
    },
    select: USER_SELECT,
  });

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
    emailEnabled: user.emailEnabled,
    department: user.department,
    jobTitle: user.jobTitle,
    externalId: user.externalId,
    isActive: user.isActive,
    isManaged: user.isManaged,
  };
}
