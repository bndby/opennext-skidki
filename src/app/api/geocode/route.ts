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

	if (!query) {
		return NextResponse.json([], { status: 200 });
	}

	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("q", query);
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("limit", String(limit));

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
