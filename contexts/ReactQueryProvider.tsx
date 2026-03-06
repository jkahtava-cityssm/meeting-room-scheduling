"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider, isServer } from "@tanstack/react-query";
import * as React from "react";
import { ZodError } from "zod";

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
				if (!isServer && process.env.NODE_ENV === "development") {
					const queryKey = query.queryKey.join(" → ");

					if (error instanceof ZodError) {
						console.group(`📐 Zod Schema Error: ${queryKey}`);
						console.table(
							error.issues.map(i => ({
								path: i.path.join("."),
								message: i.message,
								code: i.code,
							})),
						);
						console.groupEnd();
					} else {
						console.error(`Query Error [${queryKey}]:`, error);
					}
				}
			},
		}),
		mutationCache: new MutationCache({
			onError: error => {
				if (!isServer && process.env.NODE_ENV === "development") {
					console.error("Mutation Error:", error);
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
