import * as React from "react";
import type { GroupedPermissionRequirement, PermissionResult, PermissionCache } from "@/lib/auth-permission-checks";

import { useVerifySessionRequirement } from "@/lib/auth-client";
import { useSession } from "@/contexts/SessionProvider";

export function createSecurityContext<const T extends Readonly<GroupedPermissionRequirement>>(PERMISSIONS: T) {
	type Result = PermissionResult<T>;
	type Key = keyof Result;

	type Evaluatable = Key | boolean | (() => boolean) | Evaluatable[];
	type Predicate = () => boolean;

	type CtxValue = {
		cache: PermissionCache | null;
		permissions: Result;
		isVerifying: boolean;
		can: (key: Key) => boolean;
		isAllowed: (value: Evaluatable) => boolean;
		canAny: (...items: Evaluatable[]) => boolean;
		canAll: (...items: Evaluatable[]) => boolean;
	};

	const Ctx = React.createContext<CtxValue | null>(null);

	function Provider({ children }: { children: React.ReactNode }) {
		const { session } = useSession();
		const { permissions, cache, isVerifying } = useVerifySessionRequirement(session, PERMISSIONS);

		const value = React.useMemo<CtxValue>(() => {
			const can = (key: Key) => Boolean(permissions[key]);

			const isAllowed = (value: Evaluatable): boolean => {
				if (typeof value === "boolean") return value;
				if (typeof value === "function") return value();
				if (Array.isArray(value)) return value.every(v => isAllowed(v));
				return can(value);
			};

			return {
				cache,
				permissions,
				isVerifying,
				can,
				isAllowed,
				canAny: (...values: Evaluatable[]) => values.some(v => isAllowed(v)),
				canAll: (...values: Evaluatable[]) => values.every(v => isAllowed(v)),
			};
		}, [cache, permissions, isVerifying]);

		return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
	}

	function usePermissions() {
		const ctx = React.useContext(Ctx);
		if (!ctx) throw new Error("usePermissions must be used within Provider");
		return ctx;
	}

	// Declarative hide/show
	function Can({
		permissionKey,
		fallback = null,
		loadingFallback = null,
		children,
	}: {
		permissionKey: Key;
		fallback?: React.ReactNode;
		loadingFallback?: React.ReactNode;
		children: React.ReactNode;
	}) {
		const { can, isVerifying } = usePermissions();
		if (isVerifying) return <>{loadingFallback}</>;
		return can(permissionKey) ? <>{children}</> : <>{fallback}</>;
	}

	function CanRender({
		permissionKey,
		resolve,
		loadingFallback = null,
		children,
	}: {
		permissionKey?: Key;
		resolve?: (helpers: ReturnType<typeof usePermissions>) => boolean;
		loadingFallback?: React.ReactNode;
		children: (allowed: boolean) => React.ReactNode;
	}) {
		const { can, isAllowed, canAny, canAll, cache, isVerifying, permissions } = usePermissions();
		if (isVerifying) {
			return <>{loadingFallback}</>;
		}

		const allowed = permissionKey
			? can(permissionKey)
			: resolve
				? resolve({ cache, permissions, isVerifying, can, isAllowed, canAny, canAll })
				: false;

		return <>{children(allowed)}</>;
	}

	return {
		PERMISSIONS,
		Provider,
		usePermissions,
		Can,
		CanRender,
	} as const;
}
