import { fetchPOST } from "@/lib/fetch";
import { useQueryClient } from "@tanstack/react-query";

export function useRevalidateAndInvalidate() {
  const queryClient = useQueryClient();

  const paths = ["/api/users/[userId]", "/api/users"];

  const revalidateAndInvalidate = async () => {
    try {
      // Call your Next.js API route to revalidate paths
      const response = await fetchPOST("/api/admin/revalidate", {
        paths,
      });

      if (response.status !== 204) {
        throw new Error("Failed to revalidate paths");
      }

      //queryClient.invalidateQueries();
      queryClient.invalidateQueries({ queryKey: ["users"] });

      return { success: true };
    } catch (error) {
      console.error("Revalidation error:", error);
      return { success: false, error };
    }
  };

  return { revalidateAndInvalidate };
}
