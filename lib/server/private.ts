import { Role } from '../auth';
import { SessionRole } from '../types';

export async function fetchPrivateCachedUserRole(
  userId: number,
  tag: string,
  impersonatingRole?: SessionRole,
): Promise<{ data: Role[]; message: string }> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${userId}/roles`;
  return privateServerGET(url, { impersonatingRole: impersonatingRole }, 300, [tag]);
}

export async function privateServerGET(url: string, params: object = {}, revalidate: number = 0, tags?: string[]) {
  const queryString = Object.entries(params)
    .map((param) => {
      if (!param[1]) return;
      return `${param[0]}=${encodeURIComponent(param[1])}`;
    })
    .join('&');

  return fetch(`${url}?${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': process.env.PRIVATE_INTERNAL_API_KEY!,
    },

    next: {
      revalidate: revalidate,
      tags: tags,
    },
  }).then(async (res) => {
    if (res.ok) return res.json();

    const errorData = await res.json().catch(() => ({})); // Catch if body isn't JSON
    const message = errorData.message || res.statusText;

    throw new Error(`${res.status} - ${res.statusText}, ${url} [${message}]`);
  });
}
