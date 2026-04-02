"use server";

import { CACHE_TAGS } from "@/hooks/use-revalidate-cache";
import { PUBLIC_ICONFIGURATION, PUBLIC_IEVENT, PUBLIC_IROOM } from "../services/public";

export async function fetchPublicEvents(
  startDate: string,
  endDate: string,
): Promise<{ data: PUBLIC_IEVENT[]; message: string }> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/events?startdate=${startDate}&enddate=${endDate}`;
  return privateServerFetch<{ data: PUBLIC_IEVENT[]; message: string }>(url, "Failed to fetch events");
}

export async function fetchPublicRooms(): Promise<{ data: PUBLIC_IROOM[]; message: string }> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/rooms`;
  return privateServerFetch<{ data: PUBLIC_IROOM[]; message: string }>(url, "Failed to fetch rooms");
}

export async function fetchPublicConfiguration(): Promise<{ data: PUBLIC_ICONFIGURATION; message: string }> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/configuration`;
  return privateServerFetch<{ data: PUBLIC_ICONFIGURATION; message: string }>(url, "Failed to fetch configurations", {
    next: { revalidate: 1440, tags: [CACHE_TAGS.publicConfig] },
  });
}

export async function privateServerFetch<T>(
  url: string,
  contextMessage: string,
  options: RequestInit = {},
): Promise<T> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      "x-internal-api-key": process.env.PRIVATE_INTERNAL_API_KEY!,
    },
    cache: options.next?.revalidate ? undefined : "no-store",
  }).then(async (res) => {
    if (res.ok) return res.json();

    const errorData = await res.json().catch(() => ({})); // Catch if body isn't JSON
    const message = errorData.message || res.statusText;

    throw new Error(`${res.status} - ${contextMessage}, ${url} [${message}]`);
  });
}
