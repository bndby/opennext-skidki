"use client";

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
			<div className="app-container app-container--page">
				<p className="alert alert--error">Карточка не найдена.</p>
			</div>
		);
	}

	if (!card) {
		return (
			<div className="app-container app-container--page">
				<p className="text-muted">Загрузка...</p>
			</div>
		);
	}

	return (
		<div className="app-container app-container--page">
			<div className="stack">
				<Link href="/" className="btn btn--ghost btn--fit">
					Назад
				</Link>
				<h1 className="title-xl">{card.storeName}</h1>
				<article className="card-item card-item--wide" style={{ borderLeftColor: card.color }}>
					<div className="stack">
							<BarcodePreview value={card.barcodeValue} format={card.barcodeFormat} />
							<p className="text-muted">Покажите штрихкод кассиру для сканирования.</p>
							<p className="text-muted text-small">
								Использовано: {card.usageCount} раз
							</p>
					</div>
				</article>
			</div>
		</div>
	);
}
