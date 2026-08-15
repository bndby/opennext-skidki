import { distanceInKm, geoBucketKey } from "@/lib/geo/distance";
import type { GeoPoint } from "@/types/discount-card";

type NominatimResult = {
	lat: string;
	lon: string;
};

const geocodeCache = new Map<string, GeoPoint>();

export async function geocodeStoreName(
	storeName: string,
	options: {
		userPosition: GeoPoint | null;
		radiusKm?: number;
	} = { userPosition: null },
): Promise<GeoPoint | null> {
	if (typeof window === "undefined" || !navigator.onLine) {
		return null;
	}

	const { userPosition, radiusKm = 3 } = options;
	const query = storeName.trim();
	if (!query) {
		return null;
	}
	if (!userPosition) {
		return null;
	}

	const cacheKey = `${query.toLowerCase()}|${geoBucketKey(userPosition)}|${radiusKm}`;
	const cached = geocodeCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const url = new URL("/api/geocode", window.location.origin);
	url.searchParams.set("q", query);
	url.searchParams.set("limit", "8");
	url.searchParams.set("lat", String(userPosition.lat));
	url.searchParams.set("lon", String(userPosition.lon));
	url.searchParams.set("radiusKm", String(radiusKm));

	try {
		const response = await fetch(url.toString(), { cache: "no-store" });

		if (!response.ok) {
			return null;
		}

		const payload = (await response.json()) as NominatimResult[];
		const candidates = payload
			.map((item) => ({
				lat: Number(item.lat),
				lon: Number(item.lon),
			}))
			.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

		if (candidates.length === 0) {
			return null;
		}

		const nearest = candidates
			.map((candidate) => ({
				candidate,
				distance: distanceInKm(userPosition, candidate),
			}))
			.sort((a, b) => a.distance - b.distance)[0];

		if (!nearest) {
			return null;
		}

		geocodeCache.set(cacheKey, nearest.candidate);
		return nearest.candidate;
	} catch {
		return null;
	}
}
