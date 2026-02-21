export type GeoPoint = {
	lat: number;
	lon: number;
};

export type DiscountCard = {
	id: string;
	storeName: string;
	barcodeValue: string;
	barcodeFormat: string;
	color: string;
	isFavorite: boolean;
	usageCount: number;
	createdAt: string;
	updatedAt: string;
	lastUsedAt: string | null;
	storeCoords: GeoPoint | null;
};

export type UpsertDiscountCardInput = {
	storeName: string;
	barcodeValue: string;
	barcodeFormat: string;
	color: string;
	isFavorite: boolean;
	storeCoords: GeoPoint | null;
};
