import { prisma } from "@/prisma";
import { findSession } from "@/lib/data/users";

import { NextRequest } from "next/server";

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { findManyRoles } from "@/lib/data/permissions";
import { guardRoute } from "@/lib/api-guard";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  return guardRoute(
    req,
    {
      type: "or",
      requirements: [
        { type: "role", role: "Admin" },
        { type: "permission", resource: "Settings", action: "Edit Permissions" },
      ],
    },
    async () => {
      const roles = await findManyRoles();

      if (!roles) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Roles Found", roles);
    }
  );
}
