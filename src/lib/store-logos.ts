export const STORE_BRAND_KEYS = ["custom", "varka", "gippo", "sosedi", "evroopt", "green", "prostore", "korona"] as const;

export type StoreBrandKey = (typeof STORE_BRAND_KEYS)[number];

type StoreBrandConfig = {
	key: StoreBrandKey;
	label: string;
	logoSrc: string | null;
	defaultStoreName: string;
	defaultCardColor: string;
	match: RegExp[];
};

const STORE_BRAND_CONFIGS: StoreBrandConfig[] = [
	{
		key: "custom",
		label: "Другой магазин",
		logoSrc: null,
		defaultStoreName: "",
		defaultCardColor: "#1976d2",
		match: [],
	},
	{
		key: "varka",
		label: "VARKA",
		logoSrc: "/store-logos/varka.svg",
		defaultStoreName: "VARKA",
		defaultCardColor: "#1b1b1b",
		match: [/\bvarka\b/i, /варка/i],
	},
	{
		key: "gippo",
		label: "Гиппо",
		logoSrc: "/store-logos/gippo.png",
		defaultStoreName: "Гиппо",
		defaultCardColor: "#e95d1f",
		match: [/\bгиппо\b/i, /\bgippo\b/i],
	},
	{
		key: "sosedi",
		label: "Соседи",
		logoSrc: "/store-logos/sosedi.png",
		defaultStoreName: "Соседи",
		defaultCardColor: "#0081c9",
		match: [/\bсоседи\b/i, /\bsosedi\b/i],
	},
	{
		key: "evroopt",
		label: "Евроопт",
		logoSrc: "/store-logos/evroopt.svg",
		defaultStoreName: "Евроопт",
		defaultCardColor: "#8fc641",
		match: [/\bевроопт\b/i, /\bevroopt\b/i],
	},
	{
		key: "green",
		label: "Грин",
		logoSrc: "/store-logos/green.svg",
		defaultStoreName: "Green",
		defaultCardColor: "#0da018",
		match: [/\bgreen\b/i, /\bгрин\b/i],
	},
	{
		key: "prostore",
		label: "ProStore",
		logoSrc: "/store-logos/prostore.png",
		defaultStoreName: "ProStore",
		defaultCardColor: "#042d95",
		match: [/\bpro\s?store\b/i, /\bпростор\b/i],
	},
	{
		key: "korona",
		label: "Корона",
		logoSrc: "/store-logos/korona.svg",
		defaultStoreName: "Корона",
		defaultCardColor: "#f9683a",
		match: [/\bкорона\b/i, /\bkorona\b/i],
	},
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
