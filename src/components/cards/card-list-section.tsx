"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import NearMeIcon from "@mui/icons-material/NearMe";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	IconButton,
	Stack,
	Typography,
} from "@mui/material";
import Link from "next/link";

import { distanceInKm } from "@/lib/sort/cards-sort";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";
import { BarcodeMiniPreview } from "./barcode-mini-preview";

type CardListSectionProps = {
	title: string;
	cards: DiscountCard[];
	userPosition: GeoPoint | null;
	showDistance: boolean;
	onDelete: (id: string) => Promise<void>;
};

function distanceLabel(card: DiscountCard, userPosition: GeoPoint | null) {
	if (!userPosition || !card.storeCoords) {
		return null;
	}

	const km = distanceInKm(userPosition, card.storeCoords);
	return `${km.toFixed(1)} км`;
}

export function CardListSection({
	title,
	cards,
	userPosition,
	showDistance,
	onDelete,
}: CardListSectionProps) {
	return (
		<Stack spacing={1.5}>
			<Typography variant="h6">{title}</Typography>
			{cards.length === 0 ? (
				<Typography color="text.secondary">Нет карточек в этом разделе.</Typography>
			) : null}
			{cards.map((card) => (
				<Card key={card.id} sx={{ borderLeft: `12px solid ${card.color}` }}>
					<CardContent>
						<Stack spacing={1.2}>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Stack direction="row" spacing={1} alignItems="center">
									<LoyaltyIcon fontSize="small" />
									<Typography variant="subtitle1">{card.storeName}</Typography>
								</Stack>
								{card.isFavorite ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon fontSize="small" />}
							</Stack>
							<Stack direction="row" spacing={1} flexWrap="wrap">
								<Chip icon={<TrendingUpIcon />} label={card.usageCount} size="small" />
								{showDistance && distanceLabel(card, userPosition) ? (
									<Chip icon={<NearMeIcon />} label={distanceLabel(card, userPosition)} size="small" color="primary" />
								) : null}
							</Stack>
							<Box>
								<BarcodeMiniPreview value={card.barcodeValue} format={card.barcodeFormat} />
							</Box>
							<Stack direction="row" spacing={1} flexWrap="wrap">
								<Button
									component={Link}
									href={`/cards/${card.id}/use`}
									variant="contained"
									size="small"
									startIcon={<QrCode2Icon />}
								>
									Использовать
								</Button>
								<IconButton
									component={Link}
									href={`/cards/${card.id}/edit`}
									size="small"
									aria-label="Редактировать"
									sx={{
										border: "1px solid",
										borderColor: "divider",
										borderRadius: 1.5,
									}}
								>
									<EditIcon fontSize="small" />
								</IconButton>
								<IconButton
									color="error"
									size="small"
									aria-label="Удалить"
									sx={{
										border: "1px solid",
										borderColor: "error.main",
										borderRadius: 1.5,
									}}
									onClick={() => onDelete(card.id)}
								>
									<DeleteOutlineIcon fontSize="small" />
								</IconButton>
							</Stack>
						</Stack>
					</CardContent>
				</Card>
			))}
		</Stack>
	);
}
