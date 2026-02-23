import type { GeoPoint } from "@/types/discount-card";

type NominatimResult = {
	lat: string;
	lon: string;
};

function toRad(value: number) {
	return (value * Math.PI) / 180;
}

function distanceInKm(from: GeoPoint, to: GeoPoint) {
	const R = 6371;
	const dLat = toRad(to.lat - from.lat);
	const dLon = toRad(to.lon - from.lon);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

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

		const nearestInRadius = candidates
			.map((candidate) => ({
				candidate,
				distance: distanceInKm(userPosition, candidate),
			}))
			.filter((item) => item.distance <= radiusKm)
			.sort((a, b) => a.distance - b.distance)[0];

		return nearestInRadius ? nearestInRadius.candidate : null;
	} catch {
		return null;
	}
}
