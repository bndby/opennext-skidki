import { sameGeoPoint } from "@/lib/geo/distance";
import { toStoredBarcodeFormat } from "@/lib/barcode/formats";
import { CARDS_STORE, getDb } from "@/lib/storage/db";
import { normalizeStoreBrandKey } from "@/lib/store-logos";
import type { DiscountCard, GeoPoint, UpsertDiscountCardInput } from "@/types/discount-card";

function nowIso() {
	return new Date().toISOString();
}

function normalizeCard(card: DiscountCard): DiscountCard {
	return {
		...card,
		storeBrandKey: normalizeStoreBrandKey(card.storeBrandKey, card.storeName),
		storeLogoDataUrl: card.storeLogoDataUrl ?? null,
	};
}

export async function listCards() {
	const db = await getDb();
	const cards = await db.getAll(CARDS_STORE);
	return cards.map(normalizeCard);
}

export async function getCardById(id: string) {
	const db = await getDb();
	const card = await db.get(CARDS_STORE, id);
	return card ? normalizeCard(card) : null;
}

export async function createCard(input: UpsertDiscountCardInput) {
	const db = await getDb();
	const timestamp = nowIso();

	const card: DiscountCard = {
		id: crypto.randomUUID(),
		storeName: input.storeName.trim(),
		storeBrandKey: normalizeStoreBrandKey(input.storeBrandKey, input.storeName),
		storeLogoDataUrl: input.storeLogoDataUrl ?? null,
		barcodeValue: input.barcodeValue.trim(),
		barcodeFormat: toStoredBarcodeFormat(input.barcodeFormat.trim() || "CODE128"),
		color: input.color,
		isFavorite: input.isFavorite,
		usageCount: 0,
		createdAt: timestamp,
		updatedAt: timestamp,
		lastUsedAt: null,
		storeCoords: input.storeCoords,
	};

	await db.put(CARDS_STORE, card);
	return card;
}

export async function updateCard(id: string, input: UpsertDiscountCardInput) {
	const db = await getDb();
	const existing = await db.get(CARDS_STORE, id);

	if (!existing) {
		throw new Error("Карточка не найдена");
	}

	const updated: DiscountCard = {
		...existing,
		storeName: input.storeName.trim(),
		storeBrandKey: normalizeStoreBrandKey(input.storeBrandKey, input.storeName),
		storeLogoDataUrl: input.storeLogoDataUrl ?? existing.storeLogoDataUrl ?? null,
		barcodeValue: input.barcodeValue.trim(),
		barcodeFormat: toStoredBarcodeFormat(input.barcodeFormat.trim() || existing.barcodeFormat || "CODE128"),
		color: input.color,
		isFavorite: input.isFavorite,
		storeCoords: input.storeCoords,
		updatedAt: nowIso(),
	};

	await db.put(CARDS_STORE, updated);
	return updated;
}

export async function putCard(card: DiscountCard) {
	const db = await getDb();
	await db.put(CARDS_STORE, normalizeCard(card));
}

export async function persistStoreCoordsByStoreName(storeName: string, coords: GeoPoint) {
	const db = await getDb();
	const trimmedName = storeName.trim();
	if (!trimmedName) {
		return;
	}

	const cards = await db.getAll(CARDS_STORE);
	for (const card of cards) {
		if (card.storeName.trim() !== trimmedName) {
			continue;
		}

		if (sameGeoPoint(card.storeCoords, coords)) {
			continue;
		}

		await db.put(CARDS_STORE, {
			...normalizeCard(card),
			storeCoords: coords,
		});
	}
}

export async function removeCard(id: string) {
	const db = await getDb();
	await db.delete(CARDS_STORE, id);
}

export async function incrementCardUsage(id: string) {
	const db = await getDb();
	const existing = await db.get(CARDS_STORE, id);

	if (!existing) {
		throw new Error("Карточка не найдена");
	}

	const updated: DiscountCard = {
		...existing,
		usageCount: existing.usageCount + 1,
		lastUsedAt: nowIso(),
		updatedAt: nowIso(),
	};

	await db.put(CARDS_STORE, updated);
	return updated;
}
