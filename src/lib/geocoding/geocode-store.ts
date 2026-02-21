import type { GeoPoint } from "@/types/discount-card";

type NominatimResult = {
	lat: string;
	lon: string;
};

export async function geocodeStoreName(storeName: string): Promise<GeoPoint | null> {
	if (typeof window === "undefined" || !navigator.onLine) {
		return null;
	}

	const query = storeName.trim();
	if (!query) {
		return null;
	}

	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("q", query);
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("limit", "1");

	try {
		const response = await fetch(url.toString(), {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			return null;
		}

		const payload = (await response.json()) as NominatimResult[];
		const first = payload[0];

		if (!first) {
			return null;
		}

		return {
			lat: Number(first.lat),
			lon: Number(first.lon),
		};
	} catch {
		return null;
	}
}
