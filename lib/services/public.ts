import { SEvent, SRecurrence, SRoom, SRoomCategory, SRoomProperty, SStatus } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { z } from "zod";
import { fetchPublicConfiguration, fetchPublicEvents, fetchPublicRooms } from "../server/public";
import { QueryError } from "@/contexts/ReactQueryProvider";

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
    type: true,
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

const PUBLIC_SCONFIGURATION = z.object({
  hours: z.object({
    from: z.number(),
    to: z.number(),
  }),
  useSSO: z.union([z.boolean(), z.stringbool()]),
  interval: z.number(),
});

export type PUBLIC_IEVENT = z.infer<typeof PUBLIC_SEVENT>;
export type PUBLIC_IROOM = z.infer<typeof PUBLIC_SROOM>;

export const usePublicEventsQuery = (date: Date, enabled: boolean = true) =>
  useQuery({
    queryKey: ["public_events", formatDate(date)],
    queryFn: async () => {
      const result = await fetchPublicEvents(formatDate(date));

      if (!result.ok) {
        throw new Error(result.error ?? "Unknown Error");
      }

      const parsedResult = z.array(PUBLIC_SEVENT).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid event data", "usePublicEventsQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });

export const usePublicRoomsQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["public_rooms"],
    queryFn: async () => {
      const result = await fetchPublicRooms();

      if (!result.ok) {
        throw new Error(result.error ?? "Unknown Error");
      }

      const parsedResult = z.array(PUBLIC_SROOM).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid room data", "usePublicRoomsQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

export const usePublicConfiguration = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["public_configuration"],
    queryFn: async () => {
      const result = await fetchPublicConfiguration();

      if (!result.ok) {
        throw new Error(result.error ?? "Unknown Error");
      }

      const parsedResult = PUBLIC_SCONFIGURATION.safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid configuration data", "usePublicConfiguration", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 60 * 3, // 1 hour
  });
