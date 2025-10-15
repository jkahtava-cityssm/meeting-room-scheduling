import { prisma } from "@/prisma";
import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { headers } from "next/headers";
import { fetchGET } from "./fetch";

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
  name: string;
  permissions: Permission[];
};

export type Permission = {
  permit: boolean;
  resource: string;
  action: string;
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  advanced: {
    database: { useNumberId: true, generateId: false },
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
    //expiresIn: 60 * 60 * 24 * 7, // 7 days
    //updateAge: 60 * 60 * 24, // 1 day
    expiresIn: 60 * 60 * 24 * 7, // 3 Minutes
    updateAge: 60 * 60 * 24, // 1 Minute
    additionalFields: {},
  },
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          const userRole = await prisma.userRole.count({ where: { userId: Number(user.id) } });
          if (userRole > 0) return;

          const role = await prisma.role.findFirst({ where: { name: "User" } });

          if (role) {
            await prisma.userRole.create({
              data: { userId: Number(user.id), roleId: role.roleId },
            });
          }
        },
      },
      create: {
        after: async (user) => {
          const role = await prisma.role.findFirst({ where: { name: "User" } });

          if (role) {
            await prisma.userRole.create({
              data: { userId: Number(user.id), roleId: role.roleId },
            });
          }
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
    customSession(async ({ user, session }) => {
      const userData = await fetchGET(
        `${process.env.NEXTAPP_URL}/api/users/${user.id}`,
        { token: session.token },
        3600,
        [user.id]
      );

      return {
        user: {
          ...user,
          roles: userData.data ? (userData.data.roles as Role[] | undefined) : undefined,
        },
        session,
      };
    }),
  ],
});

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}
