import { normalizeStoreBrandKey } from "@/lib/store-logos";
import { listCards, putCard } from "@/lib/storage/cards-repository";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";

export const CARDS_BACKUP_VERSION = 1;

export type CardsBackup = {
	version: number;
	exportedAt: string;
	cards: DiscountCard[];
};

export type ImportBackupResult = {
	imported: number;
	updated: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseGeoPoint(value: unknown): GeoPoint | null {
	if (value == null) {
		return null;
	}

	if (!isRecord(value) || !Number.isFinite(value.lat) || !Number.isFinite(value.lon)) {
		throw new Error("Некорректные координаты магазина в бэкапе.");
	}

	return { lat: Number(value.lat), lon: Number(value.lon) };
}

function parseImportedCard(value: unknown, index: number): DiscountCard {
	if (!isRecord(value)) {
		throw new Error(`Карточка #${index + 1} имеет некорректный формат.`);
	}

	const id = typeof value.id === "string" ? value.id.trim() : "";
	const storeName = typeof value.storeName === "string" ? value.storeName.trim() : "";
	const barcodeValue = typeof value.barcodeValue === "string" ? value.barcodeValue.trim() : "";

	if (!id || !storeName || !barcodeValue) {
		throw new Error(`Карточка #${index + 1} должна содержать id, название магазина и штрихкод.`);
	}

	const createdAt = typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString();
	const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : createdAt;
	const color = typeof value.color === "string" && /^#([\da-f]{3}|[\da-f]{6})$/i.test(value.color) ? value.color : "#1976d2";
	const barcodeFormat = typeof value.barcodeFormat === "string" && value.barcodeFormat.trim() ? value.barcodeFormat.trim() : "CODE128";
	const usageCount = Number.isFinite(value.usageCount) ? Math.max(0, Math.floor(Number(value.usageCount))) : 0;
	const lastUsedAt = typeof value.lastUsedAt === "string" || value.lastUsedAt === null ? (value.lastUsedAt as string | null) : null;
	const storeLogoDataUrl = typeof value.storeLogoDataUrl === "string" ? value.storeLogoDataUrl : null;
	const storeBrandKey = normalizeStoreBrandKey(
		typeof value.storeBrandKey === "string" ? value.storeBrandKey : undefined,
		storeName,
	);

	return {
		id,
		storeName,
		storeBrandKey,
		storeLogoDataUrl,
		barcodeValue,
		barcodeFormat,
		color,
		isFavorite: Boolean(value.isFavorite),
		usageCount,
		createdAt,
		updatedAt,
		lastUsedAt,
		storeCoords: parseGeoPoint(value.storeCoords),
	};
}

export function parseCardsBackup(raw: string): CardsBackup {
	let data: unknown;

	try {
		data = JSON.parse(raw);
	} catch {
		throw new Error("Файл бэкапа не является корректным JSON.");
	}

	if (!isRecord(data)) {
		throw new Error("Некорректный файл бэкапа.");
	}

	if (data.version !== CARDS_BACKUP_VERSION) {
		throw new Error("Неподдерживаемая версия бэкапа.");
	}

	if (!Array.isArray(data.cards)) {
		throw new Error("В бэкапе нет списка карточек.");
	}

	return {
		version: CARDS_BACKUP_VERSION,
		exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : new Date().toISOString(),
		cards: data.cards.map((card, index) => parseImportedCard(card, index)),
	};
}

export async function createCardsBackup(): Promise<CardsBackup> {
	const cards = await listCards();

	return {
		version: CARDS_BACKUP_VERSION,
		exportedAt: new Date().toISOString(),
		cards,
	};
}

export function serializeCardsBackup(backup: CardsBackup) {
	return `${JSON.stringify(backup, null, 2)}\n`;
}

export function backupFileName(date = new Date()) {
	const stamp = date.toISOString().slice(0, 10);
	return `skidki-cards-${stamp}.json`;
}

export function downloadTextFile(filename: string, contents: string, mimeType = "application/json") {
	const blob = new Blob([contents], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export async function importCardsBackup(backup: CardsBackup): Promise<ImportBackupResult> {
	const existing = await listCards();
	const existingIds = new Set(existing.map((card) => card.id));
	let imported = 0;
	let updated = 0;

	for (const card of backup.cards) {
		await putCard(card);
		if (existingIds.has(card.id)) {
			updated += 1;
		} else {
			imported += 1;
		}
	}

	return { imported, updated };
}
