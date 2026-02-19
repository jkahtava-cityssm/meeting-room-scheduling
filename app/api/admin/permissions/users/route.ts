import { guardRoute } from "@/lib/api-guard";
import { BadRequestMessage, NotFoundMessage, SuccessMessage } from "@/lib/api-helpers";
import { findManyUsersWithRoles } from "@/lib/data/users";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	return guardRoute(
		request,
		{ EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" } },

		async (userId, roles, permissions) => {
			const searchParams = request.nextUrl.searchParams;

			const roleId = searchParams.get("roleId");

			if (!roleId) {
				return BadRequestMessage();
			}

			const users = await findManyUsersWithRoles(Number(roleId));

			if (!users) {
				return NotFoundMessage();
			}

			return SuccessMessage("Collected Users", users);
		},
	);
}
