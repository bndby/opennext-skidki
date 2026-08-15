/**
 * Maps scanner (ZXing) formats onto JsBarcode render formats.
 * EAN/UPC must never silently fall back to CODE128 — cashiers scan a different symbology.
 */

const ZXING_INDEX_TO_NAME = [
	"AZTEC",
	"CODABAR",
	"CODE_39",
	"CODE_93",
	"CODE_128",
	"DATA_MATRIX",
	"EAN_8",
	"EAN_13",
	"ITF",
	"MAXICODE",
	"PDF_417",
	"QR_CODE",
	"RSS_14",
	"RSS_EXPANDED",
	"UPC_A",
	"UPC_E",
	"UPC_EAN_EXTENSION",
] as const;

const ZXING_TO_JSBARCODE: Record<string, string> = {
	AZTEC: "",
	CODABAR: "codabar",
	CODE_39: "CODE39",
	CODE39: "CODE39",
	CODE_93: "CODE93",
	CODE93: "CODE93",
	CODE_128: "CODE128",
	CODE128: "CODE128",
	CODE128A: "CODE128A",
	CODE128B: "CODE128B",
	CODE128C: "CODE128C",
	DATA_MATRIX: "",
	EAN_8: "EAN8",
	EAN8: "EAN8",
	EAN_13: "EAN13",
	EAN13: "EAN13",
	EAN5: "EAN5",
	EAN2: "EAN2",
	ITF: "ITF",
	ITF14: "ITF14",
	MAXICODE: "",
	PDF_417: "",
	PDF417: "",
	QR_CODE: "",
	QR: "",
	RSS_14: "",
	RSS_EXPANDED: "",
	UPC_A: "UPC",
	UPCA: "UPC",
	UPC: "UPC",
	UPC_E: "UPCE",
	UPCE: "UPCE",
	UPC_EAN_EXTENSION: "",
};

const JS_BARCODE_FORMATS = new Set([
	"CODE128",
	"CODE128A",
	"CODE128B",
	"CODE128C",
	"CODE39",
	"CODE93",
	"EAN13",
	"EAN8",
	"EAN5",
	"EAN2",
	"UPC",
	"UPCE",
	"ITF14",
	"ITF",
	"codabar",
	"MSI",
	"pharmacode",
]);

const EAN_UPC_FAMILY = new Set([
	"EAN_8",
	"EAN8",
	"EAN_13",
	"EAN13",
	"EAN5",
	"EAN2",
	"UPC_A",
	"UPCA",
	"UPC",
	"UPC_E",
	"UPCE",
	"UPC_EAN_EXTENSION",
]);

function toZxingFormatName(raw: unknown): string | null {
	if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < ZXING_INDEX_TO_NAME.length) {
		return ZXING_INDEX_TO_NAME[raw] ?? null;
	}

	if (typeof raw !== "string") {
		return null;
	}

	const trimmed = raw.trim();
	if (!trimmed) {
		return null;
	}

	if (/^\d+$/.test(trimmed)) {
		const index = Number(trimmed);
		if (index >= 0 && index < ZXING_INDEX_TO_NAME.length) {
			return ZXING_INDEX_TO_NAME[index] ?? null;
		}
	}

	return trimmed.replaceAll("-", "_").toUpperCase();
}

export function isEanOrUpcFamily(raw: unknown): boolean {
	const name = toZxingFormatName(raw);
	if (!name) {
		return false;
	}

	return EAN_UPC_FAMILY.has(name) || EAN_UPC_FAMILY.has(name.replaceAll("_", ""));
}

export function toJsBarcodeFormat(raw: unknown): string | null {
	if (raw == null) {
		return null;
	}

	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (!trimmed) {
			return null;
		}

		if (JS_BARCODE_FORMATS.has(trimmed)) {
			return trimmed;
		}
	}

	const zxingName = toZxingFormatName(raw);
	if (!zxingName) {
		return null;
	}

	if (JS_BARCODE_FORMATS.has(zxingName)) {
		return zxingName;
	}

	const mapped = ZXING_TO_JSBARCODE[zxingName];
	if (mapped) {
		return mapped;
	}

	return null;
}

export function toStoredBarcodeFormat(raw: unknown): string {
	const jsFormat = toJsBarcodeFormat(raw);
	if (jsFormat) {
		return jsFormat;
	}

	const zxingName = toZxingFormatName(raw);
	if (zxingName) {
		return zxingName;
	}

	if (typeof raw === "string" && raw.trim()) {
		return raw.trim().toUpperCase();
	}

	return "CODE128";
}

export function canRenderBarcode(raw: unknown): boolean {
	return toJsBarcodeFormat(raw) != null;
}
