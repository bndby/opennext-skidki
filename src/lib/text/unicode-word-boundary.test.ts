import { describe, expect, it } from "vitest";

import { compileStoreMatchPattern } from "./unicode-word-boundary";

describe("compileStoreMatchPattern", () => {
	it("matches Cyrillic store names that ASCII \\b would miss", () => {
		const pattern = compileStoreMatchPattern(String.raw`\bевроопт\b`);

		expect(pattern.test("Евроопт")).toBe(true);
		expect(pattern.test("магазин Евроопт Минск")).toBe(true);
		expect(pattern.test("неевроопт")).toBe(false);
	});

	it("still matches Latin word boundaries", () => {
		const pattern = compileStoreMatchPattern(String.raw`\bevroopt\b`);

		expect(pattern.test("evroopt")).toBe(true);
		expect(pattern.test("xevroopt")).toBe(false);
	});

	it("matches multi-word Cyrillic names", () => {
		const pattern = compileStoreMatchPattern(String.raw`\bтри\s*цены\b`);

		expect(pattern.test("Три цены")).toBe(true);
		expect(pattern.test("3 цены")).toBe(false);
	});
});
