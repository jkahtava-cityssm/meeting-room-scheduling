"use server";


export async function fetchPublicEvents(date: string) {
	const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/events?date=${date}`;
	const res = await fetch(url, { headers: { "x-internal-api-key": process.env.PRIVATE_INTERNAL_API_KEY! }, cache: "no-store" });
	if (!res.ok) throw new Error("Failed to fetch events");
	return res.json();
}

export async function fetchPublicRooms() {
	const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/rooms`;
	const res = await fetch(url, { headers: { "x-internal-api-key": process.env.PRIVATE_INTERNAL_API_KEY! }, cache: "no-store" });
	if (!res.ok) throw new Error("Failed to fetch rooms");
	return res.json();
}


export async function fetchPublicConfiguration() {
	const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/public/configuration`;
	const res = await fetch(url, { headers: { "x-internal-api-key": process.env.PRIVATE_INTERNAL_API_KEY! }, next: {
      revalidate: 1440, // Revalidate every 60 seconds
      tags: ["public_configuration"],
    }});
	if (!res.ok) throw new Error("Failed to fetch configuration");
	return res.json();
}