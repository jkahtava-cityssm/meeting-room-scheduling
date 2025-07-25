import { fetchGET } from "@/lib/fetch";
import { IRoom, SRoom } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod/v4";

const AllRooms: IRoom = {
  roomId: -1,
  name: "All Rooms",
  color: "zinc",
  createdAt: new Date(),
  updatedAt: new Date(),
  icon: "Asterisk",
};

export const useRoomsQuery = (includeAllOption: boolean = false, enabled: boolean = true) =>
  useQuery({
    queryKey: ["rooms"],
    queryFn: async () =>
      fetchGET("/api/rooms").then((data) => {
        if (includeAllOption) {
          data.unshift(AllRooms);
        }

        const result = z.array(SRoom).safeParse(data);

        if (!result.success) throw new Error("Invalid event data");

        return result.data;
      }),
    enabled: enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
