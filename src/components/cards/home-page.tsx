"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { geocodeStoreName } from "@/lib/geocoding/geocode-store";
import { subscribeToPositionChanges } from "@/lib/geolocation/get-current-position";
import { sortCards } from "@/lib/sort/cards-sort";
import { listCards } from "@/lib/storage/cards-repository";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";
import { CardListSection } from "./card-list-section";

export function HomePage() {
	const [cards, setCards] = useState<DiscountCard[]>([]);
	const [isOnline, setIsOnline] = useState(false);
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

		const unsubscribe = subscribeToPositionChanges(setPosition, {
			maximumAgeMs: 15_000,
		});

		if (!unsubscribe) {
			setPosition(null);
			return;
		}

		return () => {
			unsubscribe();
		};
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

	const sortedCards = useMemo(() => {
		const cardsWithRuntimeCoords = cards.map((card) => ({
			...card,
			storeCoords: isOnline ? storeCoordsByName[card.storeName.trim()] ?? null : null,
		}));

		return sortCards(cardsWithRuntimeCoords, {
			isOnline,
			userPosition: position,
		});
	}, [cards, isOnline, position, storeCoordsByName]);

	return (
		<div className="app-container app-container--with-fab">
			<div className="stack">
				{loading ? <p className="text-muted">Загрузка карточек...</p> : null}

				{!loading && cards.length === 0 ? (
					<section className="empty-state">
						<p>Карточек пока нет. Добавьте первую карточку.</p>
					</section>
				) : null}

				{sortedCards.length > 0 ? (
					<CardListSection
						title=""
						cards={sortedCards}
						userPosition={position}
						showDistance={isOnline}
						isOnline={isOnline}
					/>
				) : null}
			</div>
			<Link href="/cards/new" className="fab" aria-label="Добавить карточку">
				<svg className="fab__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
				</svg>
			</Link>
		</div>
	);
}
