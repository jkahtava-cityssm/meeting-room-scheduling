import { prisma } from "@/prisma";
import { findSession } from "@/lib/data/users";

import { NextRequest } from "next/server";

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { GetUserRolePermissions } from "@/lib/api-guard";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const { userId } = await params;

  const sessionToken = req.nextUrl.searchParams.get("token");

  if (!userId || !sessionToken) {
    return BadRequestMessage();
  }

  const session = await findSession({ AND: { userId: Number(userId), token: sessionToken } });

  if (!session || session?.expiresAt < new Date() || session.userId != Number(userId)) {
    return BadRequestMessage("Not Authorized");
  }
  const roles = await GetUserRolePermissions(Number(userId));

  if (!roles) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("User Found", { userId: Number(userId), roles: roles });
}
