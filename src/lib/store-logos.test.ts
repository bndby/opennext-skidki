import { describe, expect, it } from "vitest";

import { inferStoreBrandKey } from "./store-logos";

describe("inferStoreBrandKey", () => {
	it("detects Belarusian brands from Cyrillic names", () => {
		expect(inferStoreBrandKey("Евроопт")).toBe("evroopt");
		expect(inferStoreBrandKey("Соседи")).toBe("sosedi");
		expect(inferStoreBrandKey("Корона")).toBe("korona");
		expect(inferStoreBrandKey("Три цены")).toBe("tri-ceny");
		expect(inferStoreBrandKey("варка")).toBe("varka");
		expect(inferStoreBrandKey("Грин")).toBe("green");
	});

	it("detects Latin aliases", () => {
		expect(inferStoreBrandKey("Green")).toBe("green");
		expect(inferStoreBrandKey("evroopt")).toBe("evroopt");
		expect(inferStoreBrandKey("Ostin")).toBe("ostin");
	});

	it("returns custom for unknown stores", () => {
		expect(inferStoreBrandKey("Неизвестный магазин")).toBe("custom");
		expect(inferStoreBrandKey("")).toBe("custom");
	});
});
