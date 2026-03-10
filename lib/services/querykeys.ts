import { useQueryClient } from "@tanstack/react-query";
import { TConfigurationKeys } from "../types";

export const queryKeys = {
  configuration: {
    all: ["configuration"] as const,
    lists: () => [...queryKeys.configuration.all, "list"] as const,
    filtered: (keys?: TConfigurationKeys[]) => [...queryKeys.configuration.lists(), { keys }] as const,
    detail: (key: string) => [...queryKeys.configuration.all, "detail", key] as const,
  },
  events: {
    all: ["events"] as const,
    ranges: () => [...queryKeys.events.all, "range"] as const,
    range: (start: string, end: string) => [...queryKeys.events.ranges(), start, end] as const,
    users: (start: string, end: string) => [...queryKeys.events.range(start, end), "user"] as const,
    user: (start: string, end: string, userId?: string) => [...queryKeys.events.users(start, end), userId] as const,
    statuses: (start: string, end: string) => [...queryKeys.events.range(start, end), "status"] as const,
    status: (start: string, end: string, statusId: string) =>
      [...queryKeys.events.statuses(start, end), statusId] as const,
    totals: () => [...queryKeys.events.all, "total"] as const,
    totalByStatus: (statusId: string) => [...queryKeys.events.totals(), "status", statusId] as const,
    details: () => ["event"] as const,
    detail: (id: number | undefined) => [...queryKeys.events.details(), id] as const,
  },
  permissions: {
    all: ["permissions"] as const,
    sets: () => [...queryKeys.permissions.all, "sets"] as const,
    roles: () => [...queryKeys.permissions.all, "roles"] as const,
    list: (type: "none" | "existing") => [...queryKeys.permissions.roles(), type] as const,
    usersByRole: () => [...queryKeys.permissions.all, "users-by-role"] as const,
    userByRole: (roleId?: string) => [...queryKeys.permissions.usersByRole(), roleId] as const,
  },
  references: {
    all: ["references"] as const,
    properties: () => [...queryKeys.references.all, "properties"] as const,
    statuses: () => [...queryKeys.references.all, "statuses"] as const,
    statusList: (type: "all" | "existing") => [...queryKeys.references.statuses(), type] as const,
    rooms: () => [...queryKeys.references.all, "rooms"] as const,
  },
  public: {
    all: ["public"] as const,
    events: () => [...queryKeys.public.all, "events"] as const,
    eventList: (date: string) => [...queryKeys.public.events(), date] as const,
    rooms: () => [...queryKeys.public.all, "rooms"] as const,
    configuration: () => [...queryKeys.public.all, "configuration"] as const,
  },

  rooms: {
    all: ["rooms"] as const,
    lists: () => [...queryKeys.rooms.all, "list"] as const,
    list: (type: "all" | "existing") => [...queryKeys.rooms.lists(), type] as const,
    categories: () => [...queryKeys.rooms.all, "categories"] as const,
    details: () => ["room"] as const,
    detail: (id: number | undefined) => [...queryKeys.rooms.details(), id] as const,
  },

  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    events: (userId?: string) => [...queryKeys.users.all, "events", userId] as const,
  },
} as const;
