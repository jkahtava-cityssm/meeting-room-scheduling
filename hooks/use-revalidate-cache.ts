import { useSession } from '@/contexts/SessionProvider';
import { fetchPOST } from '@/lib/fetch-client';
import { queryKeys } from '@/lib/services/querykeys';
import { useQueryClient } from '@tanstack/react-query';

export const CACHE_TAGS = {
  publicConfig: 'public_configuration',
  users: 'users',
  rooms: 'rooms',
  userById: (id: string) => `user_${id}`,
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export function useRevalidateAndInvalidate() {
  const queryClient = useQueryClient();
  const { session } = useSession();

  const paths = ['/api/users/[userId]', '/api/users', '/api/users/' + session?.user.id, '/api/public/configuration'];
  const tags = Object.values(CACHE_TAGS); //[session?.user.id, "users"];

  const revalidateAndInvalidate = async () => {
    try {
      const response = await fetchPOST<null>('/api/admin/revalidate', {
        paths,
        tags,
      });

      if (!response.success) {
        throw new Error('Failed to revalidate paths');
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.configuration.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.public.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.references.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

      /*clientTags.forEach(key => {
				queryClient.invalidateQueries({ queryKey: [key] });
			});*/

      return { success: true };
    } catch (error) {
      console.error('Revalidation error:', error);
      return { success: false, error };
    }
  };

  return { revalidateAndInvalidate };
}
