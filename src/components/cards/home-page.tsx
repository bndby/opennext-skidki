"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { geocodeStoreName } from "@/lib/geocoding/geocode-store";
import { getCurrentPosition } from "@/lib/geolocation/get-current-position";
import { sortCards, splitByFavorite } from "@/lib/sort/cards-sort";
import { listCards, removeCard } from "@/lib/storage/cards-repository";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";
import { CardListSection } from "./card-list-section";

export function HomePage() {
	const [cards, setCards] = useState<DiscountCard[]>([]);
	const [isOnline, setIsOnline] = useState(false);
	const [isHydrated, setIsHydrated] = useState(false);
	const [position, setPosition] = useState<GeoPoint | null>(null);
	const [storeCoordsByName, setStoreCoordsByName] = useState<Record<string, GeoPoint | null>>({});
	const [loading, setLoading] = useState(true);

	const loadCards = useCallback(async () => {
		setLoading(true);
		const data = await listCards();
		setCards(data);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadCards().catch(() => setLoading(false));
	}, [loadCards]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		setIsHydrated(true);
		setIsOnline(navigator.onLine);

		const onOnline = () => setIsOnline(true);
		const onOffline = () => setIsOnline(false);

		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);

		return () => {
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOffline);
		};
	}, []);

	useEffect(() => {
		if (!isOnline) {
			setPosition(null);
			setStoreCoordsByName({});
			return;
		}

		getCurrentPosition().then(setPosition).catch(() => setPosition(null));
	}, [isOnline]);

	useEffect(() => {
		if (!isOnline || !position || cards.length === 0) {
			setStoreCoordsByName({});
			return;
		}

		let cancelled = false;

		async function resolveStoreCoords() {
			const uniqueStoreNames = [...new Set(cards.map((card) => card.storeName.trim()).filter(Boolean))];
			const resolvedEntries = await Promise.all(
				uniqueStoreNames.map(
					async (storeName) =>
						[
							storeName,
							await geocodeStoreName(storeName, {
								userPosition: position,
								radiusKm: 3,
							}),
						] as const,
				),
			);

			if (!cancelled) {
				setStoreCoordsByName(Object.fromEntries(resolvedEntries));
			}
		}

		resolveStoreCoords().catch(() => {
			if (!cancelled) {
				setStoreCoordsByName({});
			}
		});

		return () => {
			cancelled = true;
		};
	}, [cards, isOnline, position]);

	const sorted = useMemo(() => {
		const cardsWithRuntimeCoords = cards.map((card) => ({
			...card,
			storeCoords: isOnline ? storeCoordsByName[card.storeName.trim()] ?? null : null,
		}));

		const sortedCards = sortCards(cardsWithRuntimeCoords, {
			isOnline,
			userPosition: position,
		});

		return splitByFavorite(sortedCards);
	}, [cards, isOnline, position, storeCoordsByName]);

	const onlineBadgeLabel = isHydrated && isOnline ? "Онлайн" : "Офлайн";

	return (
		<div className="app-container app-container--with-fab">
			<div className="stack">
				<section className="panel panel--header">
					<div className="row row--between row--center">
						<h1 className="title-xl">Скидочные карты</h1>
						<span className={`status-badge ${isHydrated && isOnline ? "status-badge--online" : "status-badge--offline"}`}>
							{onlineBadgeLabel}
						</span>
					</div>
				</section>

				{loading ? <p className="text-muted">Загрузка карточек...</p> : null}

				{!loading && cards.length === 0 ? (
					<section className="empty-state">
						<p>Карточек пока нет. Добавьте первую карточку.</p>
					</section>
				) : null}

				{sorted.favorites.length > 0 ? (
					<CardListSection
						title="Избранные"
						cards={sorted.favorites}
						userPosition={position}
						showDistance={isOnline}
						isOnline={isOnline}
						onDelete={async (id) => {
							await removeCard(id);
							await loadCards();
						}}
					/>
				) : null}
				{sorted.regular.length > 0 ? (
					<CardListSection
						title="Обычные"
						cards={sorted.regular}
						userPosition={position}
						showDistance={isOnline}
						isOnline={isOnline}
						onDelete={async (id) => {
							await removeCard(id);
							await loadCards();
						}}
					/>
				) : null}
			</div>
			<Link href="/cards/new" className="fab" aria-label="Добавить карточку">
				+
			</Link>
		</div>
	);
}
