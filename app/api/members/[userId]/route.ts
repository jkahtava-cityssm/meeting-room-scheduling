import { prisma } from "@/prisma";

import { NextRequest, NextResponse } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const { userId } = await params;

  if (!userId) {
    return BadRequestMessage();
  }

  const member = await prisma.member.findFirst({
    include: {
      memberRole: {
        include: {
          role: {
            include: { roleResourceAction: { include: { resource: true, action: true } } },
          },
        },
      },
    },
    where: { userId: userId },
  });

  const roles =
    member?.memberRole.map((member) => {
      return {
        name: member.role.name,
        roleId: member.role.roleId,
        actions: member.role.roleResourceAction.map((permission) => {
          return { permit: permission.permit, action: permission.action.name, resource: permission.resource.name };
        }),
      };
    }) || [];

  if (!member) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Member Found", { memberId: member.memberId, roles: roles });
}
