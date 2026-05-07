'use server';

import { formatServerURL } from './api-helpers';

type ApiResponse<T> = {
  data: T | null;
  status: number;
  message?: string;
  success: boolean;
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

async function serverRequest<T>(url: string, method: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
  const { params, data, revalidate, tags, headers } = options;

  const fullUrl = formatServerURL(url);

  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) {
          // This creates ?keys=val1&keys=val2...
          val.forEach((v) => fullUrl.searchParams.append(key, String(v)));
        } else {
          fullUrl.searchParams.append(key, String(val));
        }
      }
    });
  }

  console.log(fullUrl);
  console.log(fullUrl.toString());
  // 2. Execute Request
  const response = await fetch(fullUrl.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': process.env.PRIVATE_INTERNAL_API_KEY!,
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    next: {
      revalidate,
      tags,
    },
  });

  const status = response.status;
  const success = response.ok;

  if (status === 204) {
    return { data: null as T, status, success: true };
  }

  const json = await response.json().catch(() => ({}));

  // 3. Centralized Error Handling
  if (!success) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || response.statusText;
    throw new Error(`${response.status} - ${response.statusText}, ${url} [${message}]`);
    //Might want to do this instead of throwing an error?
    /*return { 
      data: null as T, 
      status, 
      success: false, 
      message: json.message || response.statusText 
    };*/
  }

  return {
    data: json.data ?? json,
    status,
    success: true,
    message: json.message,
  };
}

export async function privateServerGET<T>(url: string, params: FetchParams = {}, revalidate: number = 0, tags?: string[]) {
  return serverRequest<T>(url, 'GET', {
    params,
    revalidate,
    tags,
  });
}

export async function privateServerPOST<T>(url: string, data: object) {
  return serverRequest<T>(url, 'POST', { data });
}
