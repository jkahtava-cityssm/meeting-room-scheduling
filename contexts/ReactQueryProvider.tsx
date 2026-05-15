'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query';
import * as React from 'react';
import { ZodError } from 'zod';

export class QueryError extends Error {
  public hookName: string;
  public zodError?: ZodError;

  constructor(message: string, hookName: string, zodError?: ZodError) {
    super(message);
    this.name = 'Error';
    this.hookName = hookName;
    this.zodError = zodError;

    Object.setPrototypeOf(this, QueryError.prototype);
  }
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only log in the browser and in development mode
        if (!isServer && process.env.NODE_ENV === 'development') {
          const queryKey = query.queryKey.join(', ');

          if (error instanceof QueryError) {
            console.group(`Query Error: ${error.hookName}`);
            console.warn(`Message: ${error.message}`);
            console.log(`Query Key: ${queryKey}`);
            if (error.zodError) {
              const errorMap = new Map<string, { message: string; code: string }>();

              error.zodError.issues.forEach((issue) => {
                const cleanPath = issue.path.filter((segment) => typeof segment !== 'number' && isNaN(Number(segment))).join('.');

                if (!errorMap.has(cleanPath)) {
                  errorMap.set(cleanPath, {
                    message: issue.message,
                    code: issue.code,
                  });
                }
              });
              const distinctErrors = Array.from(errorMap.entries()).map(([path, details]) => ({
                property: path,
                ...details,
              }));

              console.table(distinctErrors);
            }
            console.groupEnd();
          } else {
            console.error(`Generic Query Error [${queryKey}]:`, error);
          }
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (!isServer && process.env.NODE_ENV === 'development') {
          console.error('Mutation Error:', error);
        }
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
