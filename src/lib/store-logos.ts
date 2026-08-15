import { compileStoreMatchPattern } from "@/lib/text/unicode-word-boundary";
import { GENERATED_STORE_BRANDS, type GeneratedStoreBrandKey } from "./stores.generated";

export const STORE_BRAND_KEYS = ["custom", ...GENERATED_STORE_BRANDS.map((brand) => brand.key)] as const;

export type StoreBrandKey = "custom" | GeneratedStoreBrandKey;

type StoreBrandConfig = {
	key: StoreBrandKey;
	label: string;
	logoSrc: string | null;
	defaultStoreName: string;
	defaultCardColor: string;
	match: RegExp[];
	description: string;
};

const CUSTOM_STORE_BRAND: StoreBrandConfig = {
	key: "custom",
	label: "Другой магазин",
	logoSrc: null,
	defaultStoreName: "",
	defaultCardColor: "#1976d2",
	match: [],
	description: "",
};

const STORE_BRAND_CONFIGS: StoreBrandConfig[] = [
	CUSTOM_STORE_BRAND,
	...GENERATED_STORE_BRANDS.map((brand) => ({
		...brand,
		match: brand.match.map((pattern) => compileStoreMatchPattern(pattern)),
	})),
];

const STORE_BRANDS_MAP = new Map(STORE_BRAND_CONFIGS.map((brand) => [brand.key, brand]));

export const STORE_BRAND_OPTIONS = STORE_BRAND_CONFIGS.map((brand) => ({
	key: brand.key,
	label: brand.label,
}));

export const STORE_BRAND_PRESETS = STORE_BRAND_CONFIGS.filter((brand) => brand.key !== "custom").map((brand) => ({
	key: brand.key,
	label: brand.label,
	storeName: brand.defaultStoreName,
	cardColor: brand.defaultCardColor,
}));

function getStoreInitials(storeName: string) {
	const words = storeName
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	if (words.length === 0) {
		return "??";
	}

	if (words.length === 1) {
		return words[0].slice(0, 2).toUpperCase();
	}

	return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export type StoreLogoMeta = {
	src: string | null;
	initials: string;
};

export function inferStoreBrandKey(storeName: string): StoreBrandKey {
	const trimmedName = storeName.trim();
	if (!trimmedName) {
		return "custom";
	}

	const matchedBrand = STORE_BRAND_CONFIGS.find((brand) => brand.match.some((matcher) => matcher.test(trimmedName)));
	return matchedBrand?.key ?? "custom";
}

function isStoreBrandKey(value: string): value is StoreBrandKey {
	return STORE_BRAND_KEYS.includes(value as StoreBrandKey);
}

export function normalizeStoreBrandKey(value: string | null | undefined, storeName: string): StoreBrandKey {
	if (value && isStoreBrandKey(value)) {
		return value;
	}

	return inferStoreBrandKey(storeName);
}

export function getStoreLogoMeta(storeName: string, brandKey?: StoreBrandKey): StoreLogoMeta {
	const trimmedName = storeName.trim();
	const initials = getStoreInitials(trimmedName);
	const resolvedBrandKey = normalizeStoreBrandKey(brandKey, trimmedName);
	const brand = STORE_BRANDS_MAP.get(resolvedBrandKey);

	return {
		src: brand?.logoSrc ?? null,
		initials,
	};
}
