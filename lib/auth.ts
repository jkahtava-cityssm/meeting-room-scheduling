import { prisma } from "@/prisma";
import { betterAuth, Session } from "better-auth";
import { sso } from "@better-auth/sso";
import { customSession } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { headers } from "next/headers";
import { fetchGET } from "./fetch";
import { SessionAction, SessionResource, SessionRole } from "./types";

import { getCachedUserRoles } from "./auth-role-cache";

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
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		additionalFields: { impersonatedRole: { type: "string", required: false } },
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 Minutes
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["microsoft", "github"],
			updateUserInfoOnLink: true,
		},
	},
	trustedOrigins: ["http://192.168.50.33", "https://192.168.50.33", "http://localhost:3000", "https://exampledomain.home"],
	databaseHooks: {
		session: {
			create: {
				after: async session => {
					createDefaultRole(Number(session.userId));
				},
			},
		},
		user: {
			update: {
				after: async user => {
					createDefaultRole(Number(user.id));
				},
			},
			create: {
				after: async user => {
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
			modelName: "SSOProvider",
		}),

		customSession(async ({ user, session }) => {
			const currentSession = session as Session & { impersonatedRole?: string };
			const token = session.token;
			const userId = Number(user.id);

			return {
				user: {
					...user,
					roles: await getCachedUserRoles(token, userId, currentSession.impersonatedRole),
				},
				session: currentSession,
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

async function createDefaultRole(userId: number) {
	const userRole = await prisma.userRole.count({ where: { userId: userId } });
	if (userRole > 0) return;

	const role = await prisma.role.findFirst({ where: { name: "User" } });

	if (role) {
		await prisma.userRole.create({
			data: { userId: userId, roleId: role.roleId },
		});
	}
}
