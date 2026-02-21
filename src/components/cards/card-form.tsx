"use client";

import { Alert, Button, FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { useMemo, useState, type FormEvent } from "react";

import type { DiscountCard, UpsertDiscountCardInput } from "@/types/discount-card";
import { BarcodeScanner } from "./barcode-scanner";

type CardFormProps = {
	initialCard?: DiscountCard;
	submitLabel: string;
	onSubmit: (payload: UpsertDiscountCardInput) => Promise<void>;
};

export function CardForm({ initialCard, submitLabel, onSubmit }: CardFormProps) {
	const [storeName, setStoreName] = useState(initialCard?.storeName ?? "");
	const [barcodeValue, setBarcodeValue] = useState(initialCard?.barcodeValue ?? "");
	const [barcodeFormat, setBarcodeFormat] = useState(initialCard?.barcodeFormat ?? "CODE128");
	const [color, setColor] = useState(initialCard?.color ?? "#1976d2");
	const [isFavorite, setIsFavorite] = useState(initialCard?.isFavorite ?? false);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isValid = useMemo(() => {
		return Boolean(storeName.trim()) && Boolean(barcodeValue.trim());
	}, [barcodeValue, storeName]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);

		if (!isValid) {
			setFormError("Введите название магазина и значение штрихкода.");
			return;
		}

		setIsSubmitting(true);

		try {
			await onSubmit({
				storeName,
				barcodeValue,
				barcodeFormat,
				color,
				isFavorite,
				storeCoords: null,
			});
		} catch {
			setFormError("Не удалось сохранить карточку.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Stack component="form" spacing={2} onSubmit={handleSubmit}>
			<BarcodeScanner
				onDetected={(value, format) => {
					setBarcodeValue(value);
					setBarcodeFormat(format || "CODE128");
				}}
			/>
			<TextField
				label="Название магазина"
				value={storeName}
				onChange={(event) => setStoreName(event.target.value)}
				required
				fullWidth
			/>
			<TextField
				label="Штрихкод"
				value={barcodeValue}
				onChange={(event) => setBarcodeValue(event.target.value)}
				required
				fullWidth
			/>
			<TextField
				label="Формат штрихкода"
				value={barcodeFormat}
				onChange={(event) => setBarcodeFormat(event.target.value)}
				helperText="Например: EAN13, EAN8, CODE128"
				fullWidth
			/>
			<TextField
				label="Цвет карточки"
				type="color"
				value={color}
				onChange={(event) => setColor(event.target.value)}
				fullWidth
				slotProps={{
					inputLabel: {
						shrink: true,
					},
				}}
			/>
			<FormControlLabel
				control={<Switch checked={isFavorite} onChange={(_, checked) => setIsFavorite(checked)} />}
				label="Избранная карточка"
			/>
			{formError ? <Alert severity="error">{formError}</Alert> : null}
			<Button type="submit" variant="contained" disabled={!isValid || isSubmitting}>
				{submitLabel}
			</Button>
		</Stack>
	);
}
