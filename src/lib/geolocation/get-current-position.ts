import type { GeoPoint } from "@/types/discount-card";

type GetCurrentPositionOptions = {
	timeoutMs?: number;
};

type PositionSubscriptionOptions = {
	maximumAgeMs?: number;
};

export async function getCurrentPosition(
	options: GetCurrentPositionOptions = {},
): Promise<GeoPoint | null> {
	if (typeof window === "undefined" || !("geolocation" in navigator)) {
		return null;
	}

	const timeoutMs = options.timeoutMs ?? 7000;
	const resolvePosition = (config: PositionOptions) =>
		new Promise<GeoPoint | null>((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					resolve({
						lat: position.coords.latitude,
						lon: position.coords.longitude,
					});
				},
				() => resolve(null),
				config,
			);
		});

	const fastPosition = await resolvePosition({
		enableHighAccuracy: false,
		timeout: timeoutMs,
		maximumAge: 60_000,
	});

	if (fastPosition) {
		return fastPosition;
	}

	return resolvePosition({
		enableHighAccuracy: true,
		timeout: Math.max(timeoutMs, 12_000),
		maximumAge: 0,
	});
}

export function subscribeToPositionChanges(
	onPositionChange: (position: GeoPoint | null) => void,
	options: PositionSubscriptionOptions = {},
): (() => void) | null {
	if (typeof window === "undefined" || !("geolocation" in navigator)) {
		return null;
	}

	const watchId = navigator.geolocation.watchPosition(
		(position) => {
			onPositionChange({
				lat: position.coords.latitude,
				lon: position.coords.longitude,
			});
		},
		() => {
			onPositionChange(null);
		},
		{
			enableHighAccuracy: false,
			timeout: 7000,
			maximumAge: options.maximumAgeMs ?? 15_000,
		},
	);

	return () => {
		navigator.geolocation.clearWatch(watchId);
	};
}
