"use server";

export async function fetchPublicEvents(date: string) {
	const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/events?date=${date}`;
	return privateServerFetch(url, "Failed to fetch events");
}

export async function fetchPublicRooms() {
	const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/rooms`;
	return privateServerFetch(url, "Failed to fetch rooms");
}

export async function fetchPublicConfiguration() {
	const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/configuration`;
	return privateServerFetch(url, "Failed to fetch configurations", { next: { revalidate: 1440, tags: ["public_configuration"] } });
}

// lib/server/privateFetch.ts
export async function privateServerFetch<T>(
	url: string,
	contextMessage: string,
	options: RequestInit = {},
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
	try {
		const res = await fetch(url, {
			...options,
			headers: {
				...(options.headers || {}),
				"x-internal-api-key": process.env.PRIVATE_INTERNAL_API_KEY!,
			},
			cache: "no-store",
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({}));
			const apiMessage = errorData.message || res.statusText;

			return {
				ok: false,
				data: null,
				error: `${contextMessage}: ${apiMessage}`,
			};
		}

		const json = (await res.json()) as T;

		return {
			ok: true,
			data: json,
			error: null,
		};
	} catch (err: unknown) {
		let message = "Unknown error";
		if (err instanceof Error) message = err.message;

		return {
			ok: false,
			data: null,
			error: `${contextMessage}: ${message}`,
		};
	}
}
