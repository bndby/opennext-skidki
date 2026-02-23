import { NextResponse } from "next/server";

type NominatimResult = {
	lat: string;
	lon: string;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("q")?.trim();
	const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "8"), 1), 10);
	const lat = Number(searchParams.get("lat"));
	const lon = Number(searchParams.get("lon"));
	const radiusKm = Math.min(Math.max(Number(searchParams.get("radiusKm") ?? "3"), 0.1), 10);

	if (!query) {
		return NextResponse.json([], { status: 200 });
	}
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
		return NextResponse.json([], { status: 200 });
	}

	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("q", query);
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("limit", String(limit));
	const latDelta = radiusKm / 111.32;
	const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
	const lonDelta = radiusKm / (111.32 * cosLat);
	const minLon = Math.max(-180, lon - lonDelta);
	const maxLon = Math.min(180, lon + lonDelta);
	const minLat = Math.max(-90, lat - latDelta);
	const maxLat = Math.min(90, lat + latDelta);

	url.searchParams.set("viewbox", `${minLon},${maxLat},${maxLon},${minLat}`);
	url.searchParams.set("bounded", "1");

	try {
		const response = await fetch(url.toString(), {
			headers: {
				Accept: "application/json",
				"User-Agent": "opennext-skidki/1.0 (local development)",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			return NextResponse.json([], { status: 200 });
		}

		const payload = (await response.json()) as NominatimResult[];
		return NextResponse.json(payload, { status: 200 });
	} catch {
		return NextResponse.json([], { status: 200 });
	}
}
