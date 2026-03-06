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
	return privateServerFetch(url, "Failed to fetch configurations", {
		next: { revalidate: 1440, tags: ["public_configuration"] },
	});
}

export async function privateServerFetch(
	url: string,
	contextMessage: string,
	options: RequestInit = {},
): Promise<{ ok: boolean; data: unknown; error: string | null }> {
	return fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
			"x-internal-api-key": process.env.PRIVATE_INTERNAL_API_KEY!,
		},
		cache: options.next?.revalidate ? undefined : "no-store",
	})
		.then(async res => {
			const json = await res.json().catch(() => ({}));

			if (res.ok) {
				return { ok: true, ...json, error: null };
			}

			const message = json.message || res.statusText;
			return {
				ok: false,
				data: null,
				error: `${res.status} - ${contextMessage}: ${message}`,
			};
		})
		.catch(err => {
			return {
				ok: false,
				data: null,
				error: `${contextMessage}: ${err instanceof Error ? err.message : "Network Error"}`,
			};
		});
}
