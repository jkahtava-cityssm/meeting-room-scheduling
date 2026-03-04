import { fetchDELETE, fetchGET, fetchPUT } from "@/lib/fetch";
import { IRoom, SRoom, SRoomCategory, SRoomProperty, SRoomRoles } from "@/lib/schemas/calendar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v4";

const AllRooms: IRoom = {
  roomId: -1,
  name: "All Rooms",
  color: "zinc",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  icon: "Asterisk",
  publicFacing: false,
  roomCategoryId: -1,
  roomCategory: {
    roomCategoryId: -1,
    name: "All",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const useRoomsQuery = (includeAllOption: boolean = false, enabled: boolean = true) =>
  useQuery({
    queryKey: ["rooms", includeAllOption ? "all" : "existing"],
    queryFn: async () => {
      const result = await fetchGET("/api/rooms");
      if (includeAllOption) {
        result.data.unshift(AllRooms);
      }

      const parsedResult = z.array(SRoom).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid room data");

      return parsedResult.data;
    },
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

export const useRoomQuery = (roomId: number | undefined, enabled: boolean = true) =>
  useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const result = await fetchGET(`/api/rooms/${roomId}`);

      const parsedResult = z.array(SRoom).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid room data");

      return parsedResult.data[0];
    },
    enabled: enabled && roomId !== undefined,
    gcTime: 0,
    staleTime: 0,
  });

export const SRoomPUT = SRoom.omit({
  createdAt: true,
  updatedAt: true,
  roomCategory: true,
  roomRoles: true,
  roomProperty: true,
}).extend({
  roomId: z.coerce.number().optional(),
  roomRoles: z
    .array(
      SRoomRoles.pick({ roleId: true }).extend({
        roleId: z.coerce.number(),
      }),
    )
    .optional(),
  roomProperty: z
    .array(
      SRoomProperty.omit({
        createdAt: true,
        updatedAt: true,
      }).extend({
        roomPropertyId: z.coerce.number().optional().nullable(),
        name: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
});

export type IRoomPUT = z.infer<typeof SRoomPUT>;

export const useRoomsMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IRoomPUT) => fetchPUT(`/api/rooms`, data),
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room", response.data.roomId] });
    },
  });
};

export const useRoomsMutationDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: number) => fetchDELETE(`/api/rooms/${roomId}`),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};

export const useRoomCategoryQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["rooms-categories"],
    queryFn: async () => {
      const result = await fetchGET("/api/rooms/categories");

      const parsedResult = z.array(SRoomCategory).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid room category data");

      return parsedResult.data;
    },
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

export const useRoomPropertyQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["rooms-properties"],
    queryFn: async () => {
      const result = await fetchGET("/api/rooms/properties");

      const parsedResult = z.array(SRoomProperty).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid room property data");

      return parsedResult.data;
    },
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
