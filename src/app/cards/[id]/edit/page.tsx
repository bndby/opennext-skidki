"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Alert, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CardForm } from "@/components/cards/card-form";
import { getCardById, removeCard, updateCard } from "@/lib/storage/cards-repository";
import type { DiscountCard } from "@/types/discount-card";

export default function EditCardPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [card, setCard] = useState<DiscountCard | null>(null);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		getCardById(params.id)
			.then((result) => {
				if (!result) {
					setNotFound(true);
					return;
				}
				setCard(result);
			})
			.catch(() => setNotFound(true));
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
				<Typography variant="h5">Редактирование карточки</Typography>
				<CardForm
					initialCard={card}
					submitLabel="Сохранить изменения"
					onSubmit={async (payload) => {
						await updateCard(card.id, payload);
						router.push("/");
					}}
				/>
				<Button
					variant="outlined"
					color="error"
					startIcon={<DeleteForeverIcon />}
					onClick={async () => {
						const isConfirmed = window.confirm("Удалить карточку?");
						if (!isConfirmed) {
							return;
						}

						await removeCard(card.id);
						router.push("/");
					}}
				>
					Удалить карточку
				</Button>
			</Stack>
		</Container>
	);
}
