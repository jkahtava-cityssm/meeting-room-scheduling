import { prisma } from "@/prisma";
import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins"; // Update this path if 'customSession' is exported from a different module
import { prismaAdapter } from "better-auth/adapters/prisma";

import { headers } from "next/headers";
import { fetchGET } from "./fetch";

type Role = {
  permissions: Permission[];
};

type Permission = {
  permit: boolean;
  resource: string;
  action: string;
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
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
      create: {
        after: async (user, ctx) => {
          const member = await prisma.member.create({
            data: { userId: user.id, theme: "none", timeFormat: "12hour" },
          });

          const memberRole = await prisma.memberRole.create({
            data: { memberId: member.memberId, roleId: 1 },
          });
        },
      },
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const member = await fetchGET(`http://localhost:3000/api/members/${user.id}`, {}, 3600, [user.id]);

      return {
        user: {
          ...user,
          memberId: member?.data.memberId as string | undefined | null,
          roles: member?.data.roles as Role[] | undefined | null,
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

/*
export getServerSession()
{
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session
}
*/

type User = {
  memberId: string | undefined | null;
  roles: Role[] | undefined | null;
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
};

export function hasPermission(user: User, resource: string, action: string) {
  const permission = user?.roles?.some((role) => {
    return role.permissions.some((permission) => {
      return (
        permission.permit === true &&
        permission.resource.toLowerCase() === resource.toLowerCase() &&
        permission.action.toLowerCase() === action.toLowerCase()
      );
    });
  });

  return permission;
}
