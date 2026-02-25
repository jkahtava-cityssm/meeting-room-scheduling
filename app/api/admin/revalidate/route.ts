import { guardRoute } from "@/lib/api-guard";
import { NoContentMessage } from "@/lib/api-helpers";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return guardRoute(
    req,
    { IsDevelopment: { type: "function", check: () => process.env.NEXT_PUBLIC_ENVIRONMENT === "development" } },
    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
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
    },
  );
}
