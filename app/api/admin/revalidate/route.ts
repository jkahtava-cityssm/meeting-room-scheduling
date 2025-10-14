import { NoContentMessage, BadRequestMessage } from "@/lib/api-helpers";
import { getServerSession, hasServerRole } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session || !hasServerRole(session, "Admin")) {
    return BadRequestMessage("Not Authorized");
  }

  const { paths, tags } = await req.json();

  for (const path of paths) {
    revalidatePath(path, "page");
    revalidatePath(path, "layout");
    revalidatePath(path);
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NoContentMessage();
}
