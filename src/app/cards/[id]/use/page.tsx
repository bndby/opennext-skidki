"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BarcodePreview } from "@/components/cards/barcode-preview";
import { StoreRouteMap } from "@/components/cards/store-route-map";
import { geocodeStoreName } from "@/lib/geocoding/geocode-store";
import { getCurrentPosition } from "@/lib/geolocation/get-current-position";
import { getCardById, incrementCardUsage, removeCard } from "@/lib/storage/cards-repository";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";

type OsrmRouteResponse = {
	routes?: Array<{
		duration: number;
		geometry: {
			coordinates: [number, number][];
		};
	}>;
};

async function getWalkingRoute(from: GeoPoint, to: GeoPoint) {
	const routeUrl = new URL(
		`https://router.project-osrm.org/route/v1/foot/${from.lon},${from.lat};${to.lon},${to.lat}`,
	);
	routeUrl.searchParams.set("overview", "full");
	routeUrl.searchParams.set("geometries", "geojson");

	const response = await fetch(routeUrl.toString());
	if (!response.ok) {
		return null;
	}

	const payload = (await response.json()) as OsrmRouteResponse;
	const firstRoute = payload.routes?.[0];
	if (!firstRoute) {
		return null;
	}

	return {
		durationSec: firstRoute.duration,
		path: firstRoute.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
	};
}

export default function UseCardPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [card, setCard] = useState<DiscountCard | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [nearestStoreCoords, setNearestStoreCoords] = useState<GeoPoint | null>(null);
	const [isMapLoading, setIsMapLoading] = useState(false);
	const [userPosition, setUserPosition] = useState<GeoPoint | null>(null);
	const [routePath, setRoutePath] = useState<GeoPoint[]>([]);
	const [routeDurationSec, setRouteDurationSec] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		incrementCardUsage(params.id)
			.then((updated) => {
				setCard(updated);
			})
			.catch(async () => {
				const fallback = await getCardById(params.id);
				if (!fallback) {
					setNotFound(true);
					return;
				}
				setCard(fallback);
			});
	}, [params.id]);

	useEffect(() => {
		if (!card) {
			setNearestStoreCoords(null);
			setUserPosition(null);
			setRoutePath([]);
			setRouteDurationSec(null);
			return;
		}

		let cancelled = false;
	const storeName = card.storeName;

		async function resolveNearestStore() {
			setIsMapLoading(true);
			setRoutePath([]);
			setRouteDurationSec(null);

			const userPosition = await getCurrentPosition();
			if (!cancelled) {
				setUserPosition(userPosition);
			}
			const coords = await geocodeStoreName(storeName, {
				userPosition,
				radiusKm: 3,
			});

			let walkingRoute: { durationSec: number; path: GeoPoint[] } | null = null;
			if (userPosition && coords) {
				walkingRoute = await getWalkingRoute(userPosition, coords).catch(() => null);
			}

			if (!cancelled) {
				setNearestStoreCoords(coords);
				setRoutePath(walkingRoute?.path ?? []);
				setRouteDurationSec(walkingRoute?.durationSec ?? null);
				setIsMapLoading(false);
			}
		}

		resolveNearestStore().catch(() => {
			if (!cancelled) {
				setNearestStoreCoords(null);
				setUserPosition(null);
				setRoutePath([]);
				setRouteDurationSec(null);
				setIsMapLoading(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [card]);

	const routeDurationLabel =
		routeDurationSec && Number.isFinite(routeDurationSec)
			? `${Math.max(1, Math.round(routeDurationSec / 60))} мин`
			: null;

	if (notFound) {
		return (
			<div className="app-container app-container--page">
				<p className="alert alert--error">Карточка не найдена.</p>
			</div>
		);
	}

	if (!card) {
		return (
			<div className="app-container app-container--page">
				<p className="text-muted">Загрузка...</p>
			</div>
		);
	}

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await removeCard(card.id);
			router.push("/");
		} catch {
			setIsDeleting(false);
		}
	};

	return (
		<div className="app-container app-container--page">
			<div className="stack">
				<div className="row row--center row--gap-sm">
					<Link href="/" className="btn btn--ghost btn--fit" aria-label="Назад">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
							<path
								d="M15 6L9 12L15 18"
								stroke="currentColor"
								strokeWidth="2.2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</Link>
					<h1 className="title-xl">{card.storeName}</h1>
					<span className="chip chip--muted" aria-label={`Использовано ${card.usageCount} раз`}>
						{card.usageCount}
					</span>
					<div className="row row--center row--gap-sm">
						<Link href={`/cards/${card.id}/edit`} className="icon-btn" aria-label="Редактировать">
							<svg className="icon-btn__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16.5 5a1.4 1.4 0 0 0-2 0L4 15.5V20Z"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path d="m13.5 6 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
							</svg>
						</Link>
						<button
							type="button"
							className="icon-btn icon-btn--danger"
							aria-label="Удалить"
							disabled={isDeleting}
							onClick={() => {
								void handleDelete();
							}}
						>
							<svg className="icon-btn__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M4 7h16M9 7V5h6v2m-8 0 1 12h8l1-12M10 11v5m4-5v5"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>
					</div>
				</div>
				<article className="card-item card-item--wide" style={{ borderLeftColor: card.color }}>
					<div className="stack">
						<BarcodePreview value={card.barcodeValue} format={card.barcodeFormat} />
						<section className="store-map-block">
							<h2 className="title-md">Ближайший магазин</h2>
							{isMapLoading ? <p className="text-muted text-small">Определяем ближайший магазин...</p> : null}
							{!isMapLoading && nearestStoreCoords && userPosition ? (
								<>
									<StoreRouteMap
										userPosition={userPosition}
										storePosition={nearestStoreCoords}
										routePath={routePath}
										storeName={card.storeName}
									/>
									<p className="text-muted text-small">
										{routeDurationLabel
											? `Пеший маршрут: ${routeDurationLabel}`
											: "Пеший маршрут пока не удалось построить."}
									</p>
								</>
							) : null}
							{!isMapLoading && (!nearestStoreCoords || !userPosition) ? (
								<p className="text-muted text-small">Не удалось определить вашу позицию или ближайший магазин.</p>
							) : null}
						</section>
					</div>
				</article>
			</div>
		</div>
	);
}
