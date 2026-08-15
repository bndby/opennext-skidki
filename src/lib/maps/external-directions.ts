import type { GeoPoint } from "@/types/discount-card";

function isAppleTouchDevice() {
	if (typeof navigator === "undefined") {
		return false;
	}

	return /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function getWalkingDirectionsUrl(from: GeoPoint, to: GeoPoint) {
	const origin = `${from.lat},${from.lon}`;
	const destination = `${to.lat},${to.lon}`;

	if (isAppleTouchDevice()) {
		return `https://maps.apple.com/?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&dirflg=w`;
	}

	return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}
