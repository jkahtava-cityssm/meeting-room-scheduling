import { QueryError } from '@/contexts/ReactQueryProvider';
import { fetchDELETE, fetchGET, fetchPOST, fetchPUT } from '@/lib/fetch-client';
import { IRoom, SRoom, SRoomCategory, SRoomProperty, SRoomRoles } from '@/lib/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { property } from 'lodash';
import { z } from 'zod/v4';
import { queryKeys } from './querykeys';

type IRoomCategory = z.infer<typeof SRoomCategory>;
type IRoomProperty = z.infer<typeof SRoomProperty>;

const AllRooms: IRoom = {
  roomId: -1,
  name: 'All Rooms',
  color: 'zinc',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  icon: 'asterisk',
  publicFacing: false,
  displayOrder: null,
  roomCategoryId: -1,
  roomCategory: {
    roomCategoryId: -1,
    name: 'All',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const useRoomsQuery = (includeAllOption: boolean = false, enabled: boolean = true) => {
  const type = includeAllOption ? 'all' : 'existing';
  return useQuery({
    queryKey: queryKeys.rooms.list(type),
    queryFn: async () => {
      const result = await fetchGET<IRoom[]>('/api/rooms');
      if (includeAllOption) {
        result.data?.unshift(AllRooms);
      }

      const parsedResult = z.array(SRoom).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid room data', 'useRoomsQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useRoomQuery = (roomId: number | undefined, enabled: boolean = true) =>
  useQuery({
    queryKey: queryKeys.rooms.detail(roomId),
    queryFn: async () => {
      const result = await fetchGET<IRoom[]>(`/api/rooms/${roomId}`);

      const parsedResult = z.array(SRoom).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid room data', 'useRoomQuery', parsedResult.error);
      }

      return parsedResult.data[0];
    },
    enabled: enabled && roomId !== undefined,
    gcTime: 0,
    staleTime: 0,
  });

export const SRoomPUT = z.object({
  roomId: z.coerce.number().optional(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  publicFacing: z.union([z.boolean(), z.stringbool()]),
  displayOrder: z.coerce.number().optional(),
  roomCategoryId: z.coerce.number(),
  roomProperty: z.array(z.object({ propertyId: z.coerce.number(), value: z.string() })).optional(),
  roomRoles: z.array(z.object({ roleId: z.coerce.number() })).optional(),
});

export type IRoomPUT = z.infer<typeof SRoomPUT>;

export const useRoomsMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IRoomPUT) => fetchPUT<IRoom>(`/api/rooms`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(response.data?.roomId) });
    },
  });
};

export const useRoomsMutationDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: number) => fetchDELETE<null>(`/api/rooms/${roomId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
};

export const useRoomsMutationCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IRoomPUT) => fetchPOST<IRoom>(`/api/rooms`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(response.data?.roomId) });
    },
  });
};

export const useRoomCategoryQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: queryKeys.rooms.categories(),
    queryFn: async () => {
      const result = await fetchGET<IRoomCategory[]>('/api/rooms/categories');

      const parsedResult = z.array(SRoomCategory).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid room category data', 'useRoomsCategoriesQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
