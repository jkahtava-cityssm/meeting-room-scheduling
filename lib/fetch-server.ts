'use server';

type ApiResponse<T> = {
  message?: string;
  data?: T;
  success?: boolean;
  error?: string;
};

type FetchParams = Record<string, string | number | boolean | string[] | undefined>;

type FetchOptions = {
  params?: FetchParams;
  data?: object;
  revalidate?: number;
  tags?: string[];
  headers?: Record<string, string>;
};

async function serverRequest<T>(url: string, method: string, options: FetchOptions = {}): Promise<T> {
  const { params, data, revalidate, tags, headers } = options;

  const fullUrl = new URL(url, process.env.NEXT_PUBLIC_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        fullUrl.searchParams.append(key, String(val));
      }
    });
  }

  const response = await fetch(fullUrl.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': process.env.PRIVATE_INTERNAL_API_KEY!,
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    // If revalidate is provided, use it. Otherwise, default to 'no-store' for fresh server data.
    cache: revalidate ? undefined : 'no-store',
    next: {
      revalidate,
      tags,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || response.statusText;
    throw new Error(`Server Fetch Error: ${response.status} - ${url} [${message}]`);
  }

  if (response.status === 204) return {} as T;

  return response.json();
}

export async function privateServerGET<T>(url: string, params: FetchParams = {}, revalidate: number = 0, tags?: string[]) {
  return serverRequest<ApiResponse<T>>(url, 'GET', {
    params,
    revalidate,
    tags,
  });
}

export async function privateServerPOST<T>(url: string, data: object) {
  return serverRequest<ApiResponse<T>>(url, 'POST', { data });
}
