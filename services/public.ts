import { fetchGET } from "@/lib/fetch";
import { SEvent, SRecurrence, SRoom, SRoomCategory, SRoomProperty, SStatus } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { z } from "zod";

const formatDate = (date: Date) => {
  return formatISO(date);
};

const PUBLIC_SROOM = z.object({
  roomId: SRoom.shape.roomId,
  name: SRoom.shape.name,
  color: SRoom.shape.color,
  roomCategory: SRoomCategory.pick({
    roomCategoryId: true,
    name: true,
  }),
  roomProperty: SRoomProperty.pick({
    name: true,
    value: true,
  }).array(),
});

const PUBLIC_SEVENT = z.object({
  eventId: SEvent.shape.eventId,
  endDate: SEvent.shape.endDate,
  startDate: SEvent.shape.startDate,
  recurrenceId: SEvent.shape.recurrenceId,
  recurrence: SRecurrence.pick({ rule: true, endDate: true, startDate: true }).nullish(),
  roomId: SEvent.shape.roomId,
  room: SRoom.pick({ name: true, color: true }),
  status: SStatus.pick({ statusId: true, name: true, key: true }),
});

export type PUBLIC_IEVENT = z.infer<typeof PUBLIC_SEVENT>;
export type PUBLIC_IROOM = z.infer<typeof PUBLIC_SROOM>;

export const usePublicEventsQuery = (startDate: Date, endDate: Date, enabled: boolean = true) =>
  useQuery({
    queryKey: ["events", formatDate(startDate), formatDate(endDate)],
    queryFn: async () =>
      fetchGET("/api/public/events", {
        startdate: formatDate(startDate),
        enddate: formatDate(endDate),
      }).then((result) => {
        const parsedResult = z.array(PUBLIC_SEVENT).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid event data");

        return parsedResult.data;
      }),
    enabled: enabled,
  });

export const usePublicRoomsQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["rooms"],
    queryFn: async () =>
      fetchGET("/api/public/rooms", {}).then((result) => {
        const parsedResult = z.array(PUBLIC_SROOM).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid room data");

        return parsedResult.data;
      }),
    enabled: enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

export const usePublicConfigurationsQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["config_hours"],
    queryFn: async () =>
      fetchGET("/api/public/configuration", {}, 1440, ["config_hours"]).then((result) => {
        return result.data;
      }),
    enabled: enabled,
    staleTime: 1000 * 60 * 60 * 3, // 1 hour
  });
