import { NEARBY_RADIUS_KM, distanceInKm } from "@/lib/geo/distance";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";

export { distanceInKm, NEARBY_RADIUS_KM };

function byUsageThenUpdated(a: DiscountCard, b: DiscountCard) {
	if (b.usageCount !== a.usageCount) {
		return b.usageCount - a.usageCount;
	}

	return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function sortCards(
	cards: DiscountCard[],
	options: {
		userPosition: GeoPoint | null;
	},
) {
	const { userPosition } = options;

	if (!userPosition) {
		return [...cards].sort((a, b) => {
			if (a.isFavorite !== b.isFavorite) {
				return a.isFavorite ? -1 : 1;
			}

			return byUsageThenUpdated(a, b);
		});
	}

	return [...cards].sort((a, b) => {
		if (a.isFavorite !== b.isFavorite) {
			return a.isFavorite ? -1 : 1;
		}

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
