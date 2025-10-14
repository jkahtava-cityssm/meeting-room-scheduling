import { fetchGET } from "@/lib/fetch";
import { IRoom, SRoom } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod/v4";

const AllRooms: IRoom = {
  roomId: -1,
  name: "All Rooms",
  color: "zinc",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  icon: "Asterisk",
};

export const useRoomsQuery = (includeAllOption: boolean = false, enabled: boolean = true) =>
  useQuery({
    queryKey: ["rooms", includeAllOption ? "all" : "existing"],
    queryFn: async () =>
      fetchGET("/api/rooms").then((result) => {
        if (includeAllOption) {
          result.data.unshift(AllRooms);
        }

        const parsedResult = z.array(SRoom).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid event data");

        return parsedResult.data;
      }),
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
