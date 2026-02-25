// app/api/internal/sso/register-microsoft/route.ts
import { NextRequest, NextResponse } from "next/server";

import { guardRoute } from "@/lib/api-guard";
import { auth, getServerSession } from "@/lib/auth";
import { headers } from "next/headers";
import { BadRequestMessage, DeleteMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { request } from "https";

export async function POST(req: NextRequest) {
  return guardRoute(
    req,
    { EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" } },
    async (sessionUserId, permissionCache, permissions, sessionId) => {
      const { roleId } = await req.json();

      if (!roleId || !sessionId) {
        return BadRequestMessage();
      }

      const roleName = await prisma.role.findFirst({
        select: { name: true },
        where: { roleId: Number(roleId) },
      });

      const session = await prisma.session.update({
        data: { impersonatedRole: roleName?.name || null },
        where: { id: sessionId },
      });

      return SuccessMessage("Created Impersonation", {
        sessionId: session.id,
        impersonatedRole: session.impersonatedRole,
      });
    },
  );
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();

  return guardRoute(
    req,
    { isImpersonating: { type: "function", check: () => Boolean(session?.session?.impersonatedRole) } },
    async (sessionUserId, permissionCache, permissions, sessionId) => {
      if (!sessionId) {
        return BadRequestMessage();
      }

      const session = await prisma.session.update({
        data: { impersonatedRole: null },
        where: { id: sessionId },
      });

      return DeleteMessage();
    },
  );
}
