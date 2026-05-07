'use server';

import { CACHE_TAGS } from '@/hooks/use-revalidate-cache';
import { PUBLIC_ICONFIGURATION, PUBLIC_IEVENT, PUBLIC_IROOM } from '../services/public';
import { privateServerGET } from '../fetch-server';

export async function fetchPublicEvents(startDate: string, endDate: string) {
  return privateServerGET<{ data: PUBLIC_IEVENT[]; message: string }>('/api/public/events', { startdate: startDate, enddate: endDate });
}

// 2. Simple GET
export async function fetchPublicRooms() {
  return privateServerGET<{ data: PUBLIC_IROOM[]; message: string }>('/api/public/rooms');
}

// 3. GET with specific revalidation and tags
export async function fetchPublicConfiguration() {
  return privateServerGET<{ data: PUBLIC_ICONFIGURATION; message: string }>(
    '/api/public/configuration',
    {}, // no params
    1440,
    [CACHE_TAGS.publicConfig],
  );
}
