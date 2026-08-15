import { describe, expect, it } from "vitest";

import { parseCardsBackup, serializeCardsBackup } from "./cards-backup";
import type { DiscountCard } from "@/types/discount-card";

const sampleCard: DiscountCard = {
	id: "11111111-1111-1111-1111-111111111111",
	storeName: "Евроопт",
	storeBrandKey: "evroopt",
	storeLogoDataUrl: null,
	barcodeValue: "4601234567890",
	barcodeFormat: "EAN13",
	color: "#8fc641",
	isFavorite: true,
	usageCount: 3,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-02-01T00:00:00.000Z",
	lastUsedAt: "2026-02-01T00:00:00.000Z",
	storeCoords: { lat: 53.9, lon: 27.56 },
};

describe("cards backup", () => {
	it("round-trips a valid backup", () => {
		const raw = serializeCardsBackup({
			version: 1,
			exportedAt: "2026-08-15T00:00:00.000Z",
			cards: [sampleCard],
		});
		const parsed = parseCardsBackup(raw);

		expect(parsed.cards).toHaveLength(1);
		expect(parsed.cards[0]?.storeName).toBe("Евроопт");
		expect(parsed.cards[0]?.storeCoords).toEqual({ lat: 53.9, lon: 27.56 });
	});

	it("rejects unsupported versions and missing fields", () => {
		expect(() => parseCardsBackup('{"version":2,"cards":[]}')).toThrow(/верси/);
		expect(() => parseCardsBackup("not-json")).toThrow(/JSON/);
		expect(() => parseCardsBackup('{"version":1,"cards":[{"id":"1"}]}')).toThrow(/штрихкод/);
	});
});
