"use client";

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
		<form className="stack" onSubmit={handleSubmit}>
			<BarcodeScanner
				onDetected={(value, format) => {
					setBarcodeValue(value);
					setBarcodeFormat(format || "CODE128");
				}}
			/>

			<label className="field">
				<span className="field__label">Название магазина</span>
				<input
					className="field__input"
					value={storeName}
					onChange={(event) => setStoreName(event.target.value)}
					required
					type="text"
				/>
			</label>

			<label className="field">
				<span className="field__label">Штрихкод</span>
				<input
					className="field__input"
					value={barcodeValue}
					onChange={(event) => setBarcodeValue(event.target.value)}
					required
					type="text"
				/>
			</label>

			<label className="field">
				<span className="field__label">Формат штрихкода</span>
				<input
					className="field__input"
					value={barcodeFormat}
					onChange={(event) => setBarcodeFormat(event.target.value)}
					type="text"
				/>
				<span className="field__hint">Например: EAN13, EAN8, CODE128</span>
			</label>

			<label className="field">
				<span className="field__label">Цвет карточки</span>
				<input className="field__input field__input--color" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
			</label>

			<label className="checkbox-row">
				<input type="checkbox" checked={isFavorite} onChange={(event) => setIsFavorite(event.target.checked)} />
				<span>Избранная карточка</span>
			</label>

			{formError ? <p className="alert alert--error">{formError}</p> : null}

			<button type="submit" className="btn btn--primary" disabled={!isValid || isSubmitting}>
				{submitLabel}
			</button>
		</form>
	);
}
