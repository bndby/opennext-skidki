"use client";

import Link from "next/link";

import { distanceInKm } from "@/lib/sort/cards-sort";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";
import { BarcodeMiniPreview } from "./barcode-mini-preview";

type CardListSectionProps = {
	title: string;
	cards: DiscountCard[];
	userPosition: GeoPoint | null;
	showDistance: boolean;
	isOnline: boolean;
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
	isOnline,
	onDelete,
}: CardListSectionProps) {
	return (
		<section className="stack section-list">
			<h2 className="title-lg title-lg--offset">{title}</h2>
			{cards.length === 0 ? <p className="text-muted">Нет карточек в этом разделе.</p> : null}
			{cards.map((card) => (
				<article key={card.id} className="card-item" style={{ borderLeftColor: card.color }}>
					<div className="stack card-item__content">
						<div className="row row--between row--center">
							<div className="row row--center row--gap-sm">
								<span aria-hidden="true" className="icon-token">
									CARD
								</span>
								<h3 className="title-md">{card.storeName}</h3>
							</div>
							<span aria-label={card.isFavorite ? "Избранная карточка" : "Обычная карточка"}>
								{card.isFavorite ? "*" : "-"}
							</span>
						</div>

						<div className="row row--wrap row--gap-sm">
							<span className={`chip ${isOnline ? "chip--muted" : "chip--success"}`}>USES: {card.usageCount}</span>
							{showDistance && distanceLabel(card, userPosition) ? (
								<span className={`chip ${isOnline ? "chip--success" : "chip--muted"}`}>
									DIST: {distanceLabel(card, userPosition)}
								</span>
							) : null}
						</div>

						<div className="row row--between row--center">
							<Link href={`/cards/${card.id}/use`} className="btn btn--outline btn--barcode">
								<BarcodeMiniPreview value={card.barcodeValue} format={card.barcodeFormat} />
							</Link>
							<div className="row row--center row--gap-sm">
								<Link href={`/cards/${card.id}/edit`} className="icon-btn" aria-label="Редактировать">
									ED
								</Link>
								<button type="button" className="icon-btn icon-btn--danger" aria-label="Удалить" onClick={() => onDelete(card.id)}>
									DEL
								</button>
							</div>
						</div>
					</div>
				</article>
			))}
		</section>
	);
}
