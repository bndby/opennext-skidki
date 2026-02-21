"use client";

import AddIcon from "@mui/icons-material/Add";
import {
	Alert,
	Box,
	Button,
	Container,
	Stack,
	Typography,
} from "@mui/material";
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
	const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : false);
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
		if (!isOnline || cards.length === 0) {
			setStoreCoordsByName({});
			return;
		}

		let cancelled = false;

		async function resolveStoreCoords() {
			const uniqueStoreNames = [...new Set(cards.map((card) => card.storeName.trim()).filter(Boolean))];
			const resolvedEntries = await Promise.all(
				uniqueStoreNames.map(async (storeName) => [storeName, await geocodeStoreName(storeName)] as const),
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
	}, [cards, isOnline]);

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

	return (
		<Container maxWidth="sm" sx={{ py: 3 }}>
			<Stack spacing={2}>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h5">Скидочные карты</Typography>
					<Button component={Link} href="/cards/new" variant="contained" startIcon={<AddIcon />}>
						Добавить
					</Button>
				</Stack>

				<Alert severity={isOnline ? "success" : "info"}>
					{isOnline
						? "Интернет доступен: сортировка по расстоянию до магазина (если определены координаты)."
						: "Интернета нет: сортировка по частоте использования."}
				</Alert>

				{loading ? <Typography color="text.secondary">Загрузка карточек...</Typography> : null}

				{!loading && cards.length === 0 ? (
					<Box
						sx={{
							border: "1px dashed",
							borderColor: "divider",
							borderRadius: 2,
							py: 4,
							px: 2,
						}}
					>
						<Typography>Карточек пока нет. Добавьте первую карточку.</Typography>
					</Box>
				) : null}

				{sorted.favorites.length > 0 ? (
					<CardListSection
						title="Избранные"
						cards={sorted.favorites}
						userPosition={position}
						showDistance={isOnline}
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
						onDelete={async (id) => {
							await removeCard(id);
							await loadCards();
						}}
					/>
				) : null}
			</Stack>
		</Container>
	);
}
