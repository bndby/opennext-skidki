import { CARDS_STORE, getDb } from "@/lib/storage/db";
import type { DiscountCard, UpsertDiscountCardInput } from "@/types/discount-card";

function nowIso() {
	return new Date().toISOString();
}

export async function listCards() {
	const db = await getDb();
	return db.getAll(CARDS_STORE);
}

export async function getCardById(id: string) {
	const db = await getDb();
	return db.get(CARDS_STORE, id);
}

export async function createCard(input: UpsertDiscountCardInput) {
	const db = await getDb();
	const timestamp = nowIso();

	const card: DiscountCard = {
		id: crypto.randomUUID(),
		storeName: input.storeName.trim(),
		barcodeValue: input.barcodeValue.trim(),
		barcodeFormat: input.barcodeFormat.trim() || "CODE128",
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
		barcodeValue: input.barcodeValue.trim(),
		barcodeFormat: input.barcodeFormat.trim() || existing.barcodeFormat || "CODE128",
		color: input.color,
		isFavorite: input.isFavorite,
		storeCoords: input.storeCoords,
		updatedAt: nowIso(),
	};

	await db.put(CARDS_STORE, updated);
	return updated;
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
