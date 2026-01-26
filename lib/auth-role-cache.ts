import os from "os";
import { Role } from "./auth";
import { getRolesByName, getRolesByUserId } from "./data/permissions";

const MAX_CACHE_ENTRIES = 5000;

function cacheIsSafe() {
	const rss = process.memoryUsage().rss;
	const total = os.totalmem();

	const memoryOK = rss / total < 0.95;
	const sizeOK = roleCache.size < MAX_CACHE_ENTRIES;
	return memoryOK && sizeOK;
}

function pruneExpiredEntries(now: number) {
	for (const [token, entry] of roleCache.entries()) {
		if (entry.expiresAt < now) {
			roleCache.delete(token);
		}
	}
}

const globalForCache = globalThis as unknown as {
	roleCache?: Map<string, { roles: Role[]; expiresAt: number }>;
	pruneInterval?: NodeJS.Timeout;
};

export const roleCache = (globalForCache.roleCache ??= new Map());

// A private WeakMap to store the interval safely

function ensurePruneInterval() {
	if (!globalForCache.pruneInterval) {
		globalForCache.pruneInterval = setInterval(
			() => {
				pruneExpiredEntries(Date.now());
			},
			5 * 60 * 1000,
		);
	}
}

//ensurePruneInterval();


export async function getCachedUserRoles(sessionToken: string, userId: number, impersonatingRole?: string): Promise<Role[]> {
	const now = Date.now();

	const cacheEnabled = cacheIsSafe();
	let roles: Role[];

	if (impersonatingRole) {
		return await getRolesByName(impersonatingRole);
	}

	if (cacheEnabled) {
		const cached = roleCache.get(sessionToken);

		if (cached && cached.expiresAt > now) {
			return cached.roles;
		} else {
			roles = await getRolesByUserId(userId);
			roleCache.set(sessionToken, { roles, expiresAt: now + 60 * 1000 * 5 });
			return roles;
		}
	}

    return await getRolesByUserId(userId);
}
