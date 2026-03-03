import { fetchGET, fetchPUT } from "@/lib/fetch";
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

      if (!parsedResult.success) throw new Error("Invalid event data");

      return parsedResult.data;
    },
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
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
    mutationFn: async (data: IRoomPUT) => fetchPUT(`/api/events`, data),
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", response.data.eventId] });
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
