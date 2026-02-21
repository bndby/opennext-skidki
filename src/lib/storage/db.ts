import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";

import type { DiscountCard } from "@/types/discount-card";

const DB_NAME = "discount-cards-db";
const DB_VERSION = 1;
const CARDS_STORE = "cards";

interface DiscountCardsSchema extends DBSchema {
	cards: {
		key: string;
		value: DiscountCard;
		indexes: {
			"by-store": string;
			"by-updated": string;
		};
	};
}

let dbPromise: Promise<IDBPDatabase<DiscountCardsSchema>> | null = null;

export function getDb() {
	if (!dbPromise) {
		dbPromise = openDB<DiscountCardsSchema>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				const cardsStore = db.createObjectStore(CARDS_STORE, { keyPath: "id" });
				cardsStore.createIndex("by-store", "storeName");
				cardsStore.createIndex("by-updated", "updatedAt");
			},
		});
	}

	return dbPromise;
}

export { CARDS_STORE };
