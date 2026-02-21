import type { GeoPoint } from "@/types/discount-card";

type GetCurrentPositionOptions = {
	timeoutMs?: number;
};

export async function getCurrentPosition(
	options: GetCurrentPositionOptions = {},
): Promise<GeoPoint | null> {
	if (typeof window === "undefined" || !("geolocation" in navigator)) {
		return null;
	}

	const timeoutMs = options.timeoutMs ?? 7000;

	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					lat: position.coords.latitude,
					lon: position.coords.longitude,
				});
			},
			() => resolve(null),
			{
				enableHighAccuracy: false,
				timeout: timeoutMs,
				maximumAge: 60_000,
			},
		);
	});
}
