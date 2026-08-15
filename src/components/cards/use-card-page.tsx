"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BarcodePreview } from "@/components/cards/barcode-preview";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { geocodeStoreName } from "@/lib/geocoding/geocode-store";
import { getCurrentPosition } from "@/lib/geolocation/get-current-position";
import { estimateWalkingDurationSec, distanceInKm } from "@/lib/geo/distance";
import { getWalkingDirectionsUrl } from "@/lib/maps/external-directions";
import { getCardById, incrementCardUsage, persistStoreCoordsByStoreName, removeCard } from "@/lib/storage/cards-repository";
import { ACTIVE_CARD_TRANSITION_NAME } from "@/lib/view-transitions";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";

const StoreRouteMap = dynamic(
	() => import("@/components/cards/store-route-map").then((module) => module.StoreRouteMap),
	{
		ssr: false,
		loading: () => <p className="text-muted text-small">Загружаем карту...</p>,
	},
);

const USAGE_INCREMENT_DELAY_MS = 1200;

export function UseCardPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [card, setCard] = useState<DiscountCard | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [nearestStoreCoords, setNearestStoreCoords] = useState<GeoPoint | null>(null);
	const [isMapLoading, setIsMapLoading] = useState(false);
	const [userPosition, setUserPosition] = useState<GeoPoint | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		let cancelled = false;

		getCardById(params.id)
			.then((result) => {
				if (cancelled) {
					return;
				}

				if (!result) {
					setNotFound(true);
					return;
				}

				setCard(result);
			})
			.catch(() => {
				if (!cancelled) {
					setNotFound(true);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [params.id]);

	const loadedCardId = card?.id ?? null;
	const loadedStoreName = card?.storeName ?? "";
	const fallbackStoreLat = card?.storeCoords?.lat ?? null;
	const fallbackStoreLon = card?.storeCoords?.lon ?? null;

	useEffect(() => {
		if (!loadedCardId) {
			return;
		}

		const cardId = loadedCardId;
		const timer = window.setTimeout(() => {
			incrementCardUsage(cardId)
				.then((updated) => {
					setCard((current) => (current?.id === cardId ? updated : current));
				})
				.catch(() => undefined);
		}, USAGE_INCREMENT_DELAY_MS);

		return () => {
			window.clearTimeout(timer);
		};
	}, [loadedCardId]);

	useEffect(() => {
		if (!loadedCardId || !loadedStoreName) {
			setNearestStoreCoords(null);
			setUserPosition(null);
			return;
		}

		let cancelled = false;
		const storeName = loadedStoreName;
		const fallbackStoreCoords =
			fallbackStoreLat != null && fallbackStoreLon != null
				? { lat: fallbackStoreLat, lon: fallbackStoreLon }
				: null;

		async function resolveNearestStore() {
			setIsMapLoading(true);

			const nextUserPosition = await getCurrentPosition();
			if (!cancelled) {
				setUserPosition(nextUserPosition);
			}
			const geocodedCoords = await geocodeStoreName(storeName, {
				userPosition: nextUserPosition,
				radiusKm: 3,
			});
			const coords = geocodedCoords ?? fallbackStoreCoords ?? null;

			if (geocodedCoords) {
				void persistStoreCoordsByStoreName(storeName, geocodedCoords);
			}

			if (!cancelled) {
				setNearestStoreCoords(coords);
				setIsMapLoading(false);
			}
		}

		resolveNearestStore().catch(() => {
			if (!cancelled) {
				setNearestStoreCoords(null);
				setUserPosition(null);
				setIsMapLoading(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [loadedCardId, loadedStoreName, fallbackStoreLat, fallbackStoreLon]);

	const walkingDistanceKm =
		nearestStoreCoords && userPosition ? distanceInKm(userPosition, nearestStoreCoords) : null;
	const walkingDurationSec = walkingDistanceKm == null ? null : estimateWalkingDurationSec(walkingDistanceKm);
	const routeDurationLabel =
		walkingDurationSec && Number.isFinite(walkingDurationSec)
			? `${Math.max(1, Math.round(walkingDurationSec / 60))} мин`
			: null;
	const directionsUrl =
		nearestStoreCoords && userPosition ? getWalkingDirectionsUrl(userPosition, nearestStoreCoords) : null;
	const straightPath = nearestStoreCoords && userPosition ? [userPosition, nearestStoreCoords] : [];

	if (notFound) {
		return (
			<div className="app-container app-container--page">
				<TopAppBar title="Карточка" backHref="/" />
				<p className="alert alert--error">Карточка не найдена.</p>
			</div>
		);
	}

	if (!card) {
		return (
			<div className="app-container app-container--page">
				<TopAppBar title="Карточка" backHref="/" />
				<p className="text-muted text-small">Загрузка</p>
			</div>
		);
	}

	const handleDelete = async () => {
		const isConfirmed = window.confirm("Удалить карточку? Это действие нельзя отменить.");
		if (!isConfirmed) {
			return;
		}

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
				<TopAppBar
					title={card.storeName}
					backHref="/"
					trailing={
						<>
							<span className="chip chip--muted" aria-label={`Использовано ${card.usageCount} раз`}>
								{card.usageCount}
							</span>
							<Link href={`/cards/${card.id}/edit`} className="icon-btn" aria-label="Редактировать" prefetch>
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
						</>
					}
				/>
				<article
					className="pass"
					style={{ ["--card-accent" as string]: card.color, viewTransitionName: ACTIVE_CARD_TRANSITION_NAME }}
				>
					<div className="pass__accent" aria-hidden="true" />
					<BarcodePreview value={card.barcodeValue} format={card.barcodeFormat} />
				</article>
				<section className="store-map-block">
					<h2 className="title-md">Ближайший магазин</h2>
					{isMapLoading ? <p className="text-muted text-small">Определяем магазин</p> : null}
					{!isMapLoading && nearestStoreCoords && userPosition ? (
						<>
							<StoreRouteMap
								userPosition={userPosition}
								storePosition={nearestStoreCoords}
								routePath={straightPath}
								storeName={card.storeName}
							/>
							<p className="text-muted text-small">
								{routeDurationLabel
									? `Пешком около ${routeDurationLabel}`
									: "Не удалось оценить время в пути."}
							</p>
							{directionsUrl ? (
								<a className="btn btn--outline btn--block" href={directionsUrl} target="_blank" rel="noreferrer">
									Маршрут
								</a>
							) : null}
						</>
					) : null}
					{!isMapLoading && (!nearestStoreCoords || !userPosition) ? (
						<p className="text-muted text-small">Не удалось определить позицию или магазин.</p>
					) : null}
				</section>
			</div>
		</div>
	);
}
