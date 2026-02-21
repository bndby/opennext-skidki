"use client";

import { Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function OfflinePage() {
	return (
		<Container maxWidth="sm" sx={{ py: 5 }}>
			<Stack spacing={2}>
				<Typography variant="h5">Офлайн‑режим</Typography>
				<Typography color="text.secondary">
					Интернет недоступен. Вы можете продолжить использовать сохранённые локально карточки.
				</Typography>
				<Button component={Link} href="/" variant="contained">
					Открыть карточки
				</Button>
			</Stack>
		</Container>
	);
}
