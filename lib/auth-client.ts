import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import { hasRole, isRequirementMet, PermissionRequirement } from "./api-helpers";
import { useEffect, useState } from "react";

export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: process.env.BETTER_AUTH_URL,
	plugins: [customSessionClient<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;
//export type User = typeof authClient.$Infer.Session.user;

export const { signIn, signOut, useSession } = authClient;

export function useVerifySessionRequirement(session: Session | undefined | null, requirement: PermissionRequirement) {
	const [requirementMet, setRequirementMet] = useState<boolean>(false);

	useEffect(() => {
		let active = true;

		if (!session?.user?.roles) {
			setRequirementMet(false);
			return;
		}
		(async () => {
			const result = await isRequirementMet(session.user.roles, requirement);
			if (active) {
				setRequirementMet(result);
			}
		})();

		return () => {
			active = false;
		};
	}, [session, requirement]);

	return requirementMet;
}

export function getSessionRoles(session: Session | undefined | null) {
	if (!session || !session.user || !session.user.roles) return undefined;

	return session.user.roles.map(role => role.name);
}
