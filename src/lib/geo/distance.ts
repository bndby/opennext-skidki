import type { GeoPoint } from "@/types/discount-card";

const EARTH_RADIUS_KM = 6371;
export const WALKING_SPEED_KM_H = 5;
export const NEARBY_RADIUS_KM = 3;

function toRad(value: number) {
	return (value * Math.PI) / 180;
}

export function distanceInKm(from: GeoPoint, to: GeoPoint) {
	const dLat = toRad(to.lat - from.lat);
	const dLon = toRad(to.lon - from.lon);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS_KM * c;
}

export function sameGeoPoint(left: GeoPoint | null | undefined, right: GeoPoint | null | undefined, epsilon = 1e-5) {
	if (!left || !right) {
		return left == null && right == null;
	}

	return Math.abs(left.lat - right.lat) < epsilon && Math.abs(left.lon - right.lon) < epsilon;
}

export function geoBucketKey(point: GeoPoint, digits = 3) {
	return `${point.lat.toFixed(digits)}:${point.lon.toFixed(digits)}`;
}

export function estimateWalkingDurationSec(distanceKm: number) {
	if (!Number.isFinite(distanceKm) || distanceKm < 0) {
		return null;
	}

	return (distanceKm / WALKING_SPEED_KM_H) * 3600;
}
