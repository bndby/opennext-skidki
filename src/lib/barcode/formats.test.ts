import { describe, expect, it } from "vitest";

import { canRenderBarcode, isEanOrUpcFamily, toJsBarcodeFormat, toStoredBarcodeFormat } from "./formats";

describe("toJsBarcodeFormat", () => {
	it("maps ZXing EAN_13 names and indexes to EAN13", () => {
		expect(toJsBarcodeFormat("EAN_13")).toBe("EAN13");
		expect(toJsBarcodeFormat("ean-13")).toBe("EAN13");
		expect(toJsBarcodeFormat("EAN13")).toBe("EAN13");
		expect(toJsBarcodeFormat(7)).toBe("EAN13");
		expect(toJsBarcodeFormat("7")).toBe("EAN13");
	});

	it("maps CODE_128 and CODE_39 without using a generic fallback", () => {
		expect(toJsBarcodeFormat("CODE_128")).toBe("CODE128");
		expect(toJsBarcodeFormat(4)).toBe("CODE128");
		expect(toJsBarcodeFormat("CODE_39")).toBe("CODE39");
	});

	it("does not render EAN or QR as CODE128", () => {
		expect(toJsBarcodeFormat("QR_CODE")).toBeNull();
		expect(toJsBarcodeFormat(11)).toBeNull();
		expect(toJsBarcodeFormat("DATA_MATRIX")).toBeNull();
		expect(canRenderBarcode("EAN_13")).toBe(true);
		expect(canRenderBarcode("QR_CODE")).toBe(false);
		expect(isEanOrUpcFamily("EAN_13")).toBe(true);
		expect(isEanOrUpcFamily("CODE128")).toBe(false);
	});
});

describe("toStoredBarcodeFormat", () => {
	it("stores JsBarcode names for supported scanner formats", () => {
		expect(toStoredBarcodeFormat("EAN_13")).toBe("EAN13");
		expect(toStoredBarcodeFormat(6)).toBe("EAN8");
		expect(toStoredBarcodeFormat("UPC_A")).toBe("UPC");
	});

	it("keeps unsupported 2D formats instead of rewriting them to CODE128", () => {
		expect(toStoredBarcodeFormat("QR_CODE")).toBe("QR_CODE");
		expect(toStoredBarcodeFormat(11)).toBe("QR_CODE");
	});

	it("defaults empty values to CODE128 for manual input", () => {
		expect(toStoredBarcodeFormat("")).toBe("CODE128");
		expect(toStoredBarcodeFormat(null)).toBe("CODE128");
	});
});
