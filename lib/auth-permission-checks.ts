import { Role } from "./auth";
import { DEFAULT_RESOURCE_ACTIONS, ROLES_ENUM, SessionAction, SessionResource, SessionRole } from "./types";

/**
 * 1. Creates a lookup table (object type) where the keys are Resources
 * and the values are a union of their valid Actions.
 * Example: { "User": "Create" | "Delete"; "Post": "Read" | "Edit" }
 */
type ResourceActionMap = {
	[E in (typeof DEFAULT_RESOURCE_ACTIONS)[number] as E["RESOURCE"]]: E["ACTIONS"][number];
};

/**
 * 2. A helper that extracts the valid Actions for a specific Resource 'R'.
 * If R is "Post", this returns "Read" | "Edit" based on the ResourceActionMap above.
 */
type ActionsFor<R extends SessionResource> = ResourceActionMap[R];

/**
 * 3. Generates a union of all valid "Resource::Action" string combinations.
 * It iterates through the config and creates records like "User::Create" | "Post::Read".
 */
type AnyPairKey = (typeof DEFAULT_RESOURCE_ACTIONS)[number] extends infer E
	? E extends { RESOURCE: infer R; ACTIONS: readonly (infer A)[] }
		? `${Extract<R, SessionResource>}::${Extract<A, SessionAction>}`
		: never
	: never;

/**
 * 4. A Resource/Action pair, that ensures a key like "User::Publish" cant exist
 * if "Publish" isn't a valid action for the "User" resource.
 */
type PairKey<R extends SessionResource, A extends ActionsFor<R>> = `${R}::${A}`;

/**
 * 5. Similar to AnyPairKey, but instead of a string, it creates a union of
 * valid objects. Used for passing permission requirements as structured data.
 * Example: { resource: "User", action: "Create" } | { resource: "Post", action: "Read" }
 */
type ValidPermissionPair = (typeof DEFAULT_RESOURCE_ACTIONS)[number] extends infer E
	? E extends { RESOURCE: infer R; ACTIONS: readonly (infer A)[] }
		? { resource: Extract<R, SessionResource>; action: Extract<A, SessionAction> }
		: never
	: never;

/**
 * A type-safe utility to generate a unique lookup key for a permission.
 * * It takes a specific Resource (e.g., 'Event') and a valid Action for that
 * specific resource (e.g., 'Read'), and joins them into a single string.
 * * @template R - A valid SessionResource.
 * @template A - An valid SessionAction constrained to only action that exist on Resource R.
 * @returns A string in the format "Resource::Action".
 */
function keyOf<R extends SessionResource, A extends ActionsFor<R>>(resource: R, action: A): PairKey<R, A> {
	return `${resource}::${action}` as PairKey<R, A>;
}

export type PermissionCache = {
	readonly isAdmin: boolean;
	readonly roleSet: Set<SessionRole>;
	readonly permitSet: Set<AnyPairKey>;
	readonly resourceSet: Set<SessionResource>;
};

/**
 * A runtime lookup map that associates each Resource with its allowed Actions.
 *
 * Used during the cache-building phase to "sanitize" incoming
 * permissions from the database/API, ensuring we only cache actions that are
 * explicitly defined in our system configuration.
 *
 * It transforms the array-based 'DEFAULT_RESOURCE_ACTIONS' into a
 * Key-Value object where each value is a Set for fast lookups.
 */
const RESOURCE_TO_ACTIONS: Readonly<Record<SessionResource, ReadonlySet<SessionAction>>> = Object.fromEntries(
	DEFAULT_RESOURCE_ACTIONS.map(({ RESOURCE, ACTIONS }) => [RESOURCE, new Set(ACTIONS)]),
) as never;

export type PermissionRequirement =
	| ({ type: "permission" } & ValidPermissionPair)
	| { type: "resource"; resource: SessionResource }
	| { type: "role"; role: SessionRole }
	| { type: "function"; check: (roles: PermissionCache | undefined) => boolean | Promise<boolean> }
	| { type: "and"; requirements: PermissionRequirement[] }
	| { type: "or"; requirements: PermissionRequirement[] };

export type GroupedPermissionRequirement = Record<string, PermissionRequirement | PermissionRequirement[]>;

export type PermissionResult<T extends Record<string, unknown>> = {
	[K in keyof T]: boolean;
};

export function buildPermissionCache(roles: Role[] | undefined): PermissionCache {
	const roleSet = new Set<SessionRole>();
	const permitSet = new Set<AnyPairKey>();
	const resourceSet = new Set<SessionResource>();
	let isAdmin = false;

	for (const role of roles ?? []) {
		const roleName = role.name as SessionRole;
		roleSet.add(roleName);
		if (roleName === ROLES_ENUM.Admin) isAdmin = true;

		for (const p of role.permissions ?? []) {
			if (p.permit) {
				const resource = p.resource as SessionResource;
				const action = p.action as SessionAction;

				const allowed = RESOURCE_TO_ACTIONS[resource];

				if (!allowed) {
					if (process.env.NEXT_PUBLIC_ENVIRONMENT !== "production") {
						console.warn(`[Permission Warning]: Unknown resource "${resource}" found on role "${roleName}".`);
					}
					continue;
				}

				if (!allowed.has(action)) {
					if (process.env.NEXT_PUBLIC_ENVIRONMENT !== "production") {
						console.warn(`[Permission Warning]: Action "${action}" is not valid for resource "${resource}" (Role: ${roleName}).`);
					}
					continue;
				}

				permitSet.add(keyOf(resource, action) as AnyPairKey);
				resourceSet.add(resource);
			}
		}
	}

	return { isAdmin, roleSet, permitSet, resourceSet };
}

async function isRequirementMet(permissionCache: PermissionCache, permission: PermissionRequirement): Promise<boolean> {
	switch (permission.type) {
		case "permission":
			return hasPermission(permissionCache, permission.resource, permission.action);

		case "resource":
			return hasResource(permissionCache, permission.resource);

		case "role":
			return hasRole(permissionCache, permission.role);

		case "function":
			try {
				if (typeof permission.check !== "function") return false;
				return await Promise.resolve(permission.check(permissionCache));
			} catch {
				return false;
			}

		case "and":
			for (const requirement of permission.requirements) {
				const result = await isRequirementMet(permissionCache, requirement);
				if (!result) return false; // short-circuit on first failure
			}
			return true;

		case "or":
			for (const requirement of permission.requirements) {
				const result = await isRequirementMet(permissionCache, requirement);
				if (result) return true; // short-circuit on first success
			}
			return false;

		default:
			return false;
	}
}

export interface GroupRequirementResult<T extends Readonly<GroupedPermissionRequirement>> {
	byGroup: PermissionResult<T>;
	unauthorizedMessages: string[];
}

export async function isGroupRequirementMet<T extends Readonly<GroupedPermissionRequirement>>(
	permissionCache: PermissionCache,
	groupedRequirements: T,
): Promise<GroupRequirementResult<T>> {
	const labels = Object.keys(groupedRequirements) as (keyof T)[];
	const byGroup = {} as PermissionResult<T>;
	const unauthorizedMessages: string[] = [];

	if (permissionCache.isAdmin) {
		// Admin: all groups pass
		for (const label of labels) byGroup[label] = true;
		return { byGroup, unauthorizedMessages };
	}

	// Evaluate each group independently (no cross-group short-circuiting)
	for (const label of labels) {
		const value = groupedRequirements[label];
		const items = Array.isArray(value) ? value : [value];

		let groupResult = true;
		for (const item of items) {
			const ok = await isRequirementMet(permissionCache, item);
			if (!ok) {
				groupResult = false;
				unauthorizedMessages.push(getRequirementMessage(item));
				break;
			}
		}

		byGroup[label] = groupResult;
	}

	return { byGroup, unauthorizedMessages };
}

function hasPermission(permissionCache: PermissionCache, resource: SessionResource, action: SessionAction) {
	return permissionCache.permitSet.has(keyOf(resource, action) as AnyPairKey);
}

function hasRole(permissionCache: PermissionCache, role: SessionRole) {
	//If it is a public requirement just return true we dont need to check anything
	if (role === ROLES_ENUM.Public) return true;

	if (permissionCache.roleSet.size === 0) return false;

	//if it is a Private requirement we can return true if roles has a value since the user has atleast 1 role
	//we dont care which role
	if (role === ROLES_ENUM.Private) return true;

	return permissionCache.roleSet.has(role);
}

function hasResource(permissionCache: PermissionCache, resource: SessionResource): boolean {
	return permissionCache.resourceSet.has(resource);
}

export function getRequirementMessage(req: PermissionRequirement): string {
	switch (req.type) {
		case "permission":
			return `${req.action} on ${req.resource}`;
		case "resource":
			return `Access to ${req.resource}`;
		case "role":
			return `Role: ${req.role}`;
		case "function":
			return `Custom logic check (${req.check.name || "anonymous"})`;
		case "and":
			return `All of: [${req.requirements.map(getRequirementMessage).join(", ")}]`;
		case "or":
			return `One of: [${req.requirements.map(getRequirementMessage).join(", ")}]`;
		default:
			return "Unknown Requirement";
	}
}

export const GuardRequest = {
	permit: <R extends SessionResource, A extends ActionsFor<R>>(resource: R, action: A): PermissionRequirement => ({
		type: "permission",
		...({ resource, action } as ValidPermissionPair),
	}),

	resource: (resource: SessionResource): PermissionRequirement => ({
		type: "resource",
		resource,
	}),

	role: (role: SessionRole): PermissionRequirement => ({
		type: "role",
		role,
	}),

	all: (...requirements: PermissionRequirement[]): PermissionRequirement => ({
		type: "and",
		requirements,
	}),

	any: (...requirements: PermissionRequirement[]): PermissionRequirement => ({
		type: "or",
		requirements,
	}),
	custom: (check: (cache: PermissionCache | undefined) => boolean | Promise<boolean>, name?: string): PermissionRequirement => ({
		type: "function",
		check: name ? Object.defineProperty(check, "name", { value: name }) : check,
	}),
};