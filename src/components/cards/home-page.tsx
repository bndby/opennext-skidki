"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { geocodeStoreName } from "@/lib/geocoding/geocode-store";
import { geoBucketKey } from "@/lib/geo/distance";
import { subscribeToPositionChanges } from "@/lib/geolocation/get-current-position";
import {
	precacheCardShellsInServiceWorker,
	prefetchCardRoutes,
	warmCardPageChunks,
} from "@/lib/performance/prefetch-cards";
import { sortCards } from "@/lib/sort/cards-sort";
import {
	backupFileName,
	createCardsBackup,
	downloadTextFile,
	importCardsBackup,
	parseCardsBackup,
	serializeCardsBackup,
} from "@/lib/storage/cards-backup";
import { listCards, persistStoreCoordsByStoreName } from "@/lib/storage/cards-repository";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";
import { CardListSection } from "./card-list-section";

export function HomePage() {
	const router = useRouter();
	const [cards, setCards] = useState<DiscountCard[]>([]);
	const [isOnline, setIsOnline] = useState(false);
	const [position, setPosition] = useState<GeoPoint | null>(null);
	const [isLocating, setIsLocating] = useState(false);
	const [isResolvingNearestStores, setIsResolvingNearestStores] = useState(false);
	const [storeCoordsByName, setStoreCoordsByName] = useState<Record<string, GeoPoint | null>>({});
	const [loading, setLoading] = useState(true);
	const [backupMessage, setBackupMessage] = useState<string | null>(null);
	const [backupError, setBackupError] = useState<string | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const cardsRef = useRef(cards);
	const positionRef = useRef(position);

	useEffect(() => {
		cardsRef.current = cards;
		positionRef.current = position;
	}, [cards, position]);

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
		if (loading) {
			return;
		}

		const cardIds = cards.map((card) => card.id);
		prefetchCardRoutes(router, cardIds);
		precacheCardShellsInServiceWorker(cardIds);
		warmCardPageChunks();
	}, [cards, loading, router]);

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
			setIsLocating(false);
			return;
		}

		setIsLocating(true);

		const unsubscribe = subscribeToPositionChanges(
			(nextPosition) => {
				if (nextPosition) {
					setPosition(nextPosition);
				}
				setIsLocating(false);
			},
			{
				maximumAgeMs: 15_000,
			},
		);

		if (!unsubscribe) {
			setIsLocating(false);
			return;
		}

		return () => {
			unsubscribe();
		};
	}, [isOnline]);

	const positionBucket = position ? geoBucketKey(position) : null;

	useEffect(() => {
		if (!isOnline || !positionBucket) {
			setIsResolvingNearestStores(false);
			return;
		}

		const userPosition = positionRef.current;
		const currentCards = cardsRef.current;
		if (!userPosition || currentCards.length === 0) {
			setIsResolvingNearestStores(false);
			return;
		}

		let cancelled = false;

		async function resolveStoreCoords() {
			setIsResolvingNearestStores(true);
			const fallbackCoordsByStoreName = new Map<string, GeoPoint | null>();
			for (const card of currentCards) {
				const storeName = card.storeName.trim();
				if (!storeName || fallbackCoordsByStoreName.has(storeName)) {
					continue;
				}
				fallbackCoordsByStoreName.set(storeName, card.storeCoords ?? null);
			}

			const uniqueStoreNames = [...fallbackCoordsByStoreName.keys()];
			const resolvedEntries: Array<readonly [string, GeoPoint | null]> = [];

			for (const storeName of uniqueStoreNames) {
				if (cancelled) {
					return;
				}

				const fallbackCoords = fallbackCoordsByStoreName.get(storeName) ?? null;
				const geocodedCoords = await geocodeStoreName(storeName, {
					userPosition,
					radiusKm: 3,
				});
				const coords = geocodedCoords ?? fallbackCoords;

				if (geocodedCoords) {
					await persistStoreCoordsByStoreName(storeName, geocodedCoords);
				}

				resolvedEntries.push([storeName, coords]);
			}

			if (!cancelled) {
				const coordsByName = Object.fromEntries(resolvedEntries);
				setStoreCoordsByName(coordsByName);
				setCards((current) =>
					current.map((card) => {
						const coords = coordsByName[card.storeName.trim()];
						return coords ? { ...card, storeCoords: coords } : card;
					}),
				);
				setIsResolvingNearestStores(false);
			}
		}

		resolveStoreCoords().catch(() => {
			if (!cancelled) {
				setIsResolvingNearestStores(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [cards.length, isOnline, positionBucket]);

	const sortedCards = useMemo(() => {
		const cardsWithRuntimeCoords = cards.map((card) => ({
			...card,
			storeCoords: isOnline ? (storeCoordsByName[card.storeName.trim()] ?? card.storeCoords ?? null) : (card.storeCoords ?? null),
		}));

		return sortCards(cardsWithRuntimeCoords, {
			userPosition: position,
		});
	}, [cards, isOnline, position, storeCoordsByName]);

	async function handleExport() {
		setBackupError(null);
		try {
			const backup = await createCardsBackup();
			downloadTextFile(backupFileName(), serializeCardsBackup(backup));
			setBackupMessage(`Экспортировано карточек: ${backup.cards.length}.`);
		} catch {
			setBackupError("Не удалось экспортировать карточки.");
			setBackupMessage(null);
		}
	}

	async function handleImport(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) {
			return;
		}

		setIsImporting(true);
		setBackupError(null);
		setBackupMessage(null);

		try {
			const raw = await file.text();
			const backup = parseCardsBackup(raw);
			const result = await importCardsBackup(backup);
			await loadCards();
			setBackupMessage(`Импорт завершён: новых ${result.imported}, обновлено ${result.updated}.`);
		} catch (cause) {
			setBackupError(cause instanceof Error ? cause.message : "Не удалось импортировать карточки.");
		} finally {
			setIsImporting(false);
		}
	}

	return (
		<div className="app-container app-container--with-fab">
			<div className="stack">
				<div className="row row--between row--center row--wrap">
					<h1 className="title-xl">Карты</h1>
					<div className="row row--gap-sm">
						<button type="button" className="btn btn--outline btn--fit" onClick={() => void handleExport()}>
							Экспорт
						</button>
						<label className={`btn btn--outline btn--fit ${isImporting ? "btn--disabled" : ""}`}>
							Импорт
							<input
								type="file"
								accept="application/json,.json"
								className="sr-only"
								disabled={isImporting}
								onChange={(event) => {
									void handleImport(event);
								}}
							/>
						</label>
					</div>
				</div>
				{backupMessage ? <p className="alert alert--success">{backupMessage}</p> : null}
				{backupError ? <p className="alert alert--error">{backupError}</p> : null}
				<p className="text-muted text-small">Карточки хранятся только на этом устройстве. Сделайте экспорт, чтобы не потерять их.</p>
				{loading ? <p className="text-muted">Загрузка карточек...</p> : null}
				<div className="stack stack--tight stack--loading-indicators" aria-live="polite">
					<div
						className="row row--center row--gap-sm"
						style={{ visibility: !loading && isOnline && isLocating ? "visible" : "hidden" }}
					>
						<span className="spinner" aria-hidden="true" />
						<p className="text-muted text-small">Определяем ваше местоположение...</p>
					</div>
					<div
						className="row row--center row--gap-sm"
						style={{
							visibility: !loading && isOnline && !isLocating && isResolvingNearestStores ? "visible" : "hidden",
						}}
					>
						<span className="spinner" aria-hidden="true" />
						<p className="text-muted text-small">Ищем ближайшие магазины...</p>
					</div>
				</div>

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
						showDistance={Boolean(position)}
						isOnline={isOnline}
					/>
				) : null}
			</div>
			<Link href="/cards/new" className="fab" aria-label="Добавить карточку" prefetch>
				<svg className="fab__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
				</svg>
			</Link>
		</div>
	);
}
