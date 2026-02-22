import type { DiscountCard, GeoPoint } from "@/types/discount-card";

const NEARBY_RADIUS_KM = 3;

function toRad(value: number) {
	return (value * Math.PI) / 180;
}

export function distanceInKm(from: GeoPoint, to: GeoPoint) {
	const R = 6371;
	const dLat = toRad(to.lat - from.lat);
	const dLon = toRad(to.lon - from.lon);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function byUsageThenUpdated(a: DiscountCard, b: DiscountCard) {
	if (b.usageCount !== a.usageCount) {
		return b.usageCount - a.usageCount;
	}

	return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function sortCards(
	cards: DiscountCard[],
	options: {
		isOnline: boolean;
		userPosition: GeoPoint | null;
	},
) {
	const { isOnline, userPosition } = options;

	if (!isOnline || !userPosition) {
		return [...cards].sort(byUsageThenUpdated);
	}

	return [...cards].sort((a, b) => {
		const aDistance = a.storeCoords ? distanceInKm(userPosition, a.storeCoords) : Number.POSITIVE_INFINITY;
		const bDistance = b.storeCoords ? distanceInKm(userPosition, b.storeCoords) : Number.POSITIVE_INFINITY;
		const aInNearbyRadius = Number.isFinite(aDistance) && aDistance <= NEARBY_RADIUS_KM;
		const bInNearbyRadius = Number.isFinite(bDistance) && bDistance <= NEARBY_RADIUS_KM;

		if (aInNearbyRadius !== bInNearbyRadius) {
			return aInNearbyRadius ? -1 : 1;
		}

		if (aInNearbyRadius && bInNearbyRadius && aDistance !== bDistance) {
			return aDistance - bDistance;
		}

		return byUsageThenUpdated(a, b);
	});
}

export function splitByFavorite(cards: DiscountCard[]) {
	const favorites = cards.filter((card) => card.isFavorite);
	const regular = cards.filter((card) => !card.isFavorite);

	return { favorites, regular };
}
