/**
 *
 * @param url the URL to fetch
 * @param params optional query parameters as object
 * @param revalidate default 0 - no caching, set to > 0 to enable caching with revalidation time in seconds
 * @param tags optional tags for cache invalidation
 * @returns fetched data as JSON

export async function fetchGET(url: string, params: object = {}, revalidate: number = 0, tags?: string[]) {
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
    },
    //cache: revalidate === 0 ? "no-store" : "force-cache", // Disable caching
    next: {
      revalidate: revalidate, // Revalidate every 60 seconds
      tags: tags,
    },
  }).then(async (res) => {
    if (res.ok) return res.json();

    const errorData = await res.json().catch(() => ({})); // Catch if body isn't JSON
    const message = errorData.message || res.statusText;

    throw new Error(`${res.status} - ${res.statusText}, ${url} [${message}]`);
  });
}



export async function fetchPUT(url: string, data: object) {
  return fetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }).then(async (res) => {
    if (res.ok) return res.json();

    const errorData = await res.json().catch(() => ({})); // Catch if body isn't JSON
    const message = errorData.message || res.statusText;

    throw new Error(`${res.status} - ${res.statusText}, ${url} [${message}]`);
  });
}

export async function fetchDELETE(url: string) {
  return fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  }).then(async (res) => {
    if (res.ok) return res.json();

    const errorData = await res.json().catch(() => ({})); // Catch if body isn't JSON
    const message = errorData.message || res.statusText;

    throw new Error(`${res.status} - ${res.statusText}, ${url} [${message}]`);
  });
}

export async function fetchPOST(url: string, data: object) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }).then(async (res) => {
    if (res.ok) return res.json();

    const errorData = await res.json().catch(() => ({})); // Catch if body isn't JSON
    const message = errorData.message || res.statusText;

    throw new Error(`${res.status} - ${res.statusText}, ${url} [${message}]`);
  });
}

export async function fetchPATCH(url: string, data: object) {
  return fetch(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }).then(async (res) => {
    if (res.ok) return res.json();

    const errorData = await res.json().catch(() => ({})); // Catch if body isn't JSON
    const message = errorData.message || res.statusText;

    throw new Error(`${res.status} - ${res.statusText}, ${url} [${message}]`);
  });
}


 */

type FetchOptions = {
  params?: Record<string, string | number | boolean | undefined>;
  data?: object;
  revalidate?: number;
  tags?: string[];
  headers?: Record<string, string>;
};

async function clientRequest<T>(url: string, method: string, options: FetchOptions = {}): Promise<T> {
  const { params, data, revalidate, tags, headers } = options;

  // 1. Build URL with query parameters
  const fullUrl = new URL(url, process.env.NEXT_PUBLIC_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        fullUrl.searchParams.append(key, String(val));
      }
    });
  }

  // 2. Execute Request
  const response = await fetch(fullUrl.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    next: {
      revalidate,
      tags,
    },
  });

  // 3. Centralized Error Handling
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || response.statusText;
    throw new Error(`${response.status} - ${response.statusText}, ${url} [${message}]`);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) return {} as T;

  return response.json();
}

export async function fetchGET<T>(
  url: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate: number = 0,
  tags?: string[],
) {
  return clientRequest<T>(url, 'GET', { params, revalidate, tags });
}

export async function fetchPOST<T>(url: string, data: object) {
  return clientRequest<T>(url, 'POST', { data });
}

export async function fetchPUT<T>(url: string, data: object) {
  return clientRequest<T>(url, 'PUT', { data });
}

export async function fetchDELETE<T>(url: string) {
  return clientRequest<T>(url, 'DELETE');
}

export async function fetchPATCH<T>(url: string, data: object) {
  return clientRequest<T>(url, 'PATCH', { data });
}
