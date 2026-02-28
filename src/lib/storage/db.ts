import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";

import { inferStoreBrandKey } from "@/lib/store-logos";
import type { DiscountCard } from "@/types/discount-card";

const DB_NAME = "discount-cards-db";
const DB_VERSION = 2;
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
			async upgrade(db, oldVersion, _newVersion, transaction) {
				if (oldVersion < 1) {
					const cardsStore = db.createObjectStore(CARDS_STORE, { keyPath: "id" });
					cardsStore.createIndex("by-store", "storeName");
					cardsStore.createIndex("by-updated", "updatedAt");
				}

				if (oldVersion < 2) {
					const cardsStore = transaction.objectStore(CARDS_STORE);
					let cursor = await cardsStore.openCursor();
					while (cursor) {
						const card = cursor.value;
						if (!card.storeBrandKey) {
							await cursor.update({
								...card,
								storeBrandKey: inferStoreBrandKey(card.storeName),
							});
						}
						cursor = await cursor.continue();
					}
				}
			},
		});
	}

	return dbPromise;
}

export { CARDS_STORE };
