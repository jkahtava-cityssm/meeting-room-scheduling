import { prisma } from '@/prisma';
import { betterAuth, Session } from 'better-auth';
import { sso } from '@better-auth/sso';
import { customSession } from 'better-auth/plugins';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { headers } from 'next/headers';
import { SessionAction, SessionResource, SessionRole } from './types';

import { getCachedUserRoles } from './auth-role-cache';
import { nextCookies } from 'better-auth/next-js';
import { createUserRole, getDefaultRole } from './data/users';
import { fetchPrivateCachedUserRole } from './server/private';

export type User = {
  userId: string | undefined | null;
  roles: Role[] | undefined;
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
};

export type Role = {
  roleId: number;
  name: SessionRole;
  permissions: Permission[];
};

export type Permission = {
  permit: boolean;
  resource: SessionResource;
  action: SessionAction;
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: `${process.env.DATABASE_PROVIDER}` as 'postgresql' | 'sqlserver',
  }),
  baseURL: 'http://localhost:3000',
  basePath: '/api/auth',
  logger: {
    level: 'debug',
  },
  advanced: {
    database: { useNumberId: true, generateId: 'serial' },
    trustedProxyHeaders: true,
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for'],
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    },
    microsoft: {
      clientId: process.env.AZURE_AD_CLIENT_ID as string,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
      tenantId: process.env.AZURE_AD_TENANT_ID as string,
      disableProfilePhoto: false,
      overrideUserInfoOnSignIn: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    additionalFields: { impersonatedRole: { type: 'string', required: false } },
    cookieCache: {
      enabled: true,
      maxAge: 10 * 60, // 5 Minutes
      strategy: 'compact',
      //refreshCache: { updateAge: 60 * 2 },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['microsoft', 'github'],
      updateUserInfoOnLink: true,
    },
  },
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',').filter(Boolean) || [],

  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          createDefaultRole(Number(session.userId));
        },
      },
    },
    user: {
      update: {
        after: async (user) => {
          createDefaultRole(Number(user.id));
        },
      },
      create: {
        after: async (user) => {
          createDefaultRole(Number(user.id));
        },
      },
    },
  },
  /*user: {
    additionalFields: {
      userId: { type: "string", required:true, defaultValue: null },
      roles: { type: "number[]"},
    },
  },*/

  plugins: [
    sso({
      modelName: 'SSOProvider',
    }),

    customSession(async ({ user, session }) => {
      const currentSession = session as Session & { impersonatedRole?: string };
      const token = session.token;
      const userId = Number(user.id);

      const impersonatingRole = currentSession.impersonatedRole;

      const cacheKey = impersonatingRole ? `impersonate:${token}:${impersonatingRole}` : token;

      const result = await fetchPrivateCachedUserRole(userId, cacheKey, impersonatingRole as SessionRole);

      const roles = result.data ? result.data : [];
      return {
        user: {
          ...user,
          roles: roles,
        },
        session: currentSession,
      };
    }),
    nextCookies(), // make sure this is the last plugin in the array
  ],
});

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

async function createDefaultRole(userId: number) {
  const userRole = await prisma.userRole.count({ where: { userId: userId } });
  if (userRole > 0) return;

  const defaultRole = await getDefaultRole();

  const roleId = Number(defaultRole.roleId);
  if (!Number.isFinite(roleId)) {
    console.warn('Default role ID is not set or invalid. Skipping default role assignment.');
    return;
  }

  const role = await prisma.role.findFirst({ where: { roleId: roleId }, orderBy: { roleId: 'asc' } });

  if (role) {
    await createUserRole({ userId: userId, roleId: role.roleId, granted: true }, 0);
  }
}
