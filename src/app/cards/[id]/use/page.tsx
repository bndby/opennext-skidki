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
				<div className="row row--center row--gap-sm">
					<Link href="/" className="btn btn--ghost btn--fit" aria-label="Назад">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
							<path
								d="M15 6L9 12L15 18"
								stroke="currentColor"
								strokeWidth="2.2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</Link>
					<h1 className="title-xl">{card.storeName}</h1>
					<span className="chip chip--muted" aria-label={`Использовано ${card.usageCount} раз`}>
						{card.usageCount}
					</span>
				</div>
				<article className="card-item card-item--wide" style={{ borderLeftColor: card.color }}>
					<div className="stack">
							<BarcodePreview value={card.barcodeValue} format={card.barcodeFormat} />
					</div>
				</article>
			</div>
		</div>
	);
}
