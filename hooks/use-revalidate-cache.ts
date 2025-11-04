import { fetchPOST } from "@/lib/fetch";
import { useQueryClient } from "@tanstack/react-query";
import { useClientSession } from "./use-client-auth";

export function useRevalidateAndInvalidate() {
  const queryClient = useQueryClient();
  const { session } = useClientSession();

  const paths = ["/api/users/[userId]", "/api/users", "/api/users/" + session?.user.id];
  const tags = [session?.user.id, "users"];

  const clientTags = ["users", "rooms"];

  const revalidateAndInvalidate = async () => {
    try {
      // Call your Next.js API route to revalidate paths
      const response = await fetchPOST("/api/admin/revalidate", {
        paths,
        tags,
      });

      if (response.status !== 204) {
        throw new Error("Failed to revalidate paths");
      }

      clientTags.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });

      return { success: true };
    } catch (error) {
      console.error("Revalidation error:", error);
      return { success: false, error };
    }
  };

  return { revalidateAndInvalidate };
}
