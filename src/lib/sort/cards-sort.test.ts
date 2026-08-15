import { describe, expect, it } from "vitest";

import { sortCards } from "./cards-sort";
import type { DiscountCard } from "@/types/discount-card";

function card(overrides: Partial<DiscountCard> & Pick<DiscountCard, "id" | "storeName">): DiscountCard {
	return {
		storeBrandKey: "custom",
		barcodeValue: "123",
		barcodeFormat: "CODE128",
		color: "#1976d2",
		isFavorite: false,
		usageCount: 0,
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		lastUsedAt: null,
		storeCoords: null,
		...overrides,
	};
}

describe("sortCards", () => {
	it("keeps favorites first without location", () => {
		const sorted = sortCards(
			[
				card({ id: "a", storeName: "A", usageCount: 10 }),
				card({ id: "b", storeName: "B", isFavorite: true, usageCount: 1 }),
			],
			{ userPosition: null },
		);

		expect(sorted.map((item) => item.id)).toEqual(["b", "a"]);
	});

	it("sorts nearby stores ahead of far ones when position is known", () => {
		const userPosition = { lat: 53.9, lon: 27.56 };
		const sorted = sortCards(
			[
				card({
					id: "far",
					storeName: "Far",
					storeCoords: { lat: 52.1, lon: 23.7 },
					usageCount: 50,
				}),
				card({
					id: "near",
					storeName: "Near",
					storeCoords: { lat: 53.901, lon: 27.561 },
					usageCount: 0,
				}),
			],
			{ userPosition },
		);

		expect(sorted.map((item) => item.id)).toEqual(["near", "far"]);
	});
});
