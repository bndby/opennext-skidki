import { afterEach, describe, expect, it, vi } from "vitest";

import { getWalkingDirectionsUrl } from "./external-directions";

const from = { lat: 53.9, lon: 27.56 };
const to = { lat: 53.91, lon: 27.57 };

describe("getWalkingDirectionsUrl", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("opens Google Maps walking directions by default", () => {
		vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0", platform: "Linux x86_64", maxTouchPoints: 0 });
		const url = getWalkingDirectionsUrl(from, to);
		expect(url).toContain("google.com/maps/dir");
		expect(url).toContain("travelmode=walking");
	});

	it("opens Apple Maps walking directions on iPhone", () => {
		vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", platform: "iPhone", maxTouchPoints: 5 });
		const url = getWalkingDirectionsUrl(from, to);
		expect(url).toContain("maps.apple.com");
		expect(url).toContain("dirflg=w");
	});
});
