"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BarcodePreview } from "@/components/cards/barcode-preview";
import { getCardById, incrementCardUsage } from "@/lib/storage/cards-repository";
import type { DiscountCard } from "@/types/discount-card";

export default function UseCardPage() {
	const params = useParams<{ id: string }>();
	const [card, setCard] = useState<DiscountCard | null>(null);
	const [notFound, setNotFound] = useState(false);

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

	if (notFound) {
		return (
			<Container maxWidth="sm" sx={{ py: 3 }}>
				<Alert severity="error">Карточка не найдена.</Alert>
			</Container>
		);
	}

	if (!card) {
		return (
			<Container maxWidth="sm" sx={{ py: 3 }}>
				<Typography color="text.secondary">Загрузка...</Typography>
			</Container>
		);
	}

	return (
		<Container maxWidth="sm" sx={{ py: 3 }}>
			<Stack spacing={2}>
				<Button component={Link} href="/" variant="text" startIcon={<ArrowBackIcon />} sx={{ alignSelf: "start" }}>
					Назад
				</Button>
				<Typography variant="h5">{card.storeName}</Typography>
				<Card sx={{ borderLeft: `12px solid ${card.color}` }}>
					<CardContent>
						<Stack spacing={1.5}>
							<BarcodePreview value={card.barcodeValue} format={card.barcodeFormat} />
							<Typography variant="body2" color="text.secondary">
								Покажите штрихкод кассиру для сканирования.
							</Typography>
							<Typography variant="caption" color="text.secondary">
								Использовано: {card.usageCount} раз
							</Typography>
						</Stack>
					</CardContent>
				</Card>
			</Stack>
		</Container>
	);
}
