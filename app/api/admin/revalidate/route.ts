import { NoContentMessage, BadRequestMessage, SuccessMessage } from "@/lib/api-helpers";
import { getServerSession, hasServerRole } from "@/lib/auth";
import { Session } from "@/lib/auth-client";
import { betterFetch } from "better-auth/react";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session || !hasServerRole(session, "Admin")) {
    return BadRequestMessage("Not Authorized");
  }

  const { paths } = await req.json();

  for (const path of paths) {
    revalidatePath(path, "page");
  }

  revalidateTag("users");
  return NoContentMessage();
}
