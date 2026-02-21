"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CardForm } from "@/components/cards/card-form";
import { createCard } from "@/lib/storage/cards-repository";

export default function NewCardPage() {
	const router = useRouter();

	return (
		<Container maxWidth="sm" sx={{ py: 3 }}>
			<Stack spacing={2}>
				<Button component={Link} href="/" variant="text" startIcon={<ArrowBackIcon />} sx={{ alignSelf: "start" }}>
					Назад
				</Button>
				<Typography variant="h5">Новая карточка</Typography>
				<CardForm
					submitLabel="Сохранить карточку"
					onSubmit={async (payload) => {
						await createCard(payload);
						router.push("/");
					}}
				/>
			</Stack>
		</Container>
	);
}
