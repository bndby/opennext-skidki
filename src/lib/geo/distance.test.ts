import { describe, expect, it } from "vitest";

import { distanceInKm, estimateWalkingDurationSec, geoBucketKey, sameGeoPoint } from "./distance";

describe("distanceInKm", () => {
	it("returns about 111 km for one degree of longitude at the equator", () => {
		const km = distanceInKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 });
		expect(km).toBeGreaterThan(110);
		expect(km).toBeLessThan(112);
	});
});

describe("estimateWalkingDurationSec", () => {
	it("uses 5 km/h walking speed", () => {
		expect(estimateWalkingDurationSec(5)).toBe(3600);
		expect(estimateWalkingDurationSec(-1)).toBeNull();
	});
});

describe("geo helpers", () => {
	it("buckets coordinates to 3 decimal places", () => {
		expect(geoBucketKey({ lat: 53.9023, lon: 27.5619 })).toBe("53.902:27.562");
	});

	it("compares points with a small epsilon", () => {
		expect(sameGeoPoint({ lat: 53.9, lon: 27.56 }, { lat: 53.9, lon: 27.56 })).toBe(true);
		expect(sameGeoPoint({ lat: 53.9, lon: 27.56 }, { lat: 54, lon: 27.56 })).toBe(false);
		expect(sameGeoPoint(null, null)).toBe(true);
	});
});
