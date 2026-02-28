"use client";

import { useMemo, useState, type FormEvent } from "react";

import { STORE_BRAND_PRESETS, normalizeStoreBrandKey, type StoreBrandKey } from "@/lib/store-logos";
import type { DiscountCard, UpsertDiscountCardInput } from "@/types/discount-card";
import { BarcodeScanner } from "./barcode-scanner";

type CardFormProps = {
	initialCard?: DiscountCard;
	submitLabel: string;
	enableBrandPresetPicker?: boolean;
	onSubmit: (payload: UpsertDiscountCardInput) => Promise<void>;
};

function readFileAsDataUrl(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ""));
		reader.onerror = () => reject(new Error("Не удалось прочитать файл логотипа."));
		reader.readAsDataURL(file);
	});
}

export function CardForm({ initialCard, submitLabel, enableBrandPresetPicker = false, onSubmit }: CardFormProps) {
	const [storeName, setStoreName] = useState(initialCard?.storeName ?? "");
	const [storeBrandKey, setStoreBrandKey] = useState<StoreBrandKey>(() =>
		normalizeStoreBrandKey(initialCard?.storeBrandKey, initialCard?.storeName ?? ""),
	);
	const [storeLogoDataUrl, setStoreLogoDataUrl] = useState<string | null>(initialCard?.storeLogoDataUrl ?? null);
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
				storeBrandKey,
				storeLogoDataUrl,
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

			{enableBrandPresetPicker && STORE_BRAND_PRESETS.length > 0 ? (
				<label className="field">
					<span className="field__label">Предустановленный бренд</span>
					<select
						className="field__input"
						defaultValue=""
						onChange={(event) => {
							const nextBrandKey = event.target.value as StoreBrandKey;
							if (!nextBrandKey) {
								return;
							}

							const preset = STORE_BRAND_PRESETS.find((item) => item.key === nextBrandKey);
							if (!preset) {
								return;
							}

							setStoreBrandKey(preset.key);
							setStoreName(preset.storeName);
							setColor(preset.cardColor);
							setStoreLogoDataUrl(null);
						}}
					>
						<option value="">Выберите бренд</option>
						{STORE_BRAND_PRESETS.map((preset) => (
							<option key={preset.key} value={preset.key}>
								{preset.label}
							</option>
						))}
					</select>
					<span className="field__hint">Подставит название, логотип и цвет карточки.</span>
				</label>
			) : null}

			<label className="field">
				<span className="field__label">Название магазина</span>
				<input
					className="field__input"
					value={storeName}
					onChange={(event) => {
						const nextStoreName = event.target.value;
						setStoreName(nextStoreName);
						setStoreBrandKey(normalizeStoreBrandKey(undefined, nextStoreName));
					}}
					required
					type="text"
				/>
			</label>

			<label className="field">
				<span className="field__label">Логотип магазина</span>
				<input
					className="field__input"
					type="file"
					accept="image/*"
					onChange={async (event) => {
						const file = event.target.files?.[0];
						if (!file) {
							return;
						}

						if (!file.type.startsWith("image/")) {
							setFormError("Можно загрузить только изображение.");
							return;
						}

						if (file.size > 2 * 1024 * 1024) {
							setFormError("Логотип слишком большой. Максимум 2 МБ.");
							return;
						}

						try {
							const dataUrl = await readFileAsDataUrl(file);
							setStoreLogoDataUrl(dataUrl);
							setStoreBrandKey("custom");
							setFormError(null);
						} catch {
							setFormError("Не удалось загрузить логотип.");
						}
					}}
				/>
				<span className="field__hint">PNG/JPG/WebP, до 2 МБ</span>
				{storeLogoDataUrl ? (
					<div className="row row--center row--gap-sm">
						<span className="store-logo" aria-hidden="true">
							<img src={storeLogoDataUrl} alt="" className="store-logo__img" />
						</span>
						<button
							type="button"
							className="btn btn--ghost btn--fit"
							onClick={() => {
								setStoreLogoDataUrl(null);
								setStoreBrandKey(normalizeStoreBrandKey(undefined, storeName));
							}}
						>
							Убрать логотип
						</button>
					</div>
				) : null}
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
