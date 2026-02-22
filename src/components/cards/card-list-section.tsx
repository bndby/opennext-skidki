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
							<span
								className={`favorite-badge ${card.isFavorite ? "favorite-badge--active" : ""}`}
								aria-label={card.isFavorite ? "Избранная карточка" : "Обычная карточка"}
							>
								<svg className="favorite-badge__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path
										d="m12 3 2.8 5.7 6.2.9-4.5 4.3 1.1 6.1L12 17.1 6.4 20l1.1-6.1L3 9.6l6.2-.9L12 3Z"
										stroke="currentColor"
										strokeWidth="1.8"
										strokeLinecap="round"
										strokeLinejoin="round"
										fill={card.isFavorite ? "currentColor" : "none"}
									/>
								</svg>
							</span>
						</div>

						<div className="row row--wrap row--gap-sm">
							<span className={`chip ${isOnline ? "chip--muted" : "chip--success"}`}>
								<svg className="chip__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path
										d="M6 4v4m12-4v4M5 8h14a1 1 0 0 1 1 1v2H4V9a1 1 0 0 1 1-1Zm-1 5h16v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Zm4 3h3"
										stroke="currentColor"
										strokeWidth="1.8"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
								{card.usageCount}
							</span>
							{showDistance && distanceLabel(card, userPosition) ? (
								<span className={`chip ${isOnline ? "chip--success" : "chip--muted"}`}>
									<svg className="chip__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path
											d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
											stroke="currentColor"
											strokeWidth="1.8"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
									</svg>
									{distanceLabel(card, userPosition)}
								</span>
							) : null}
						</div>

						<div className="row row--between row--center">
							<Link href={`/cards/${card.id}/use`} className="btn btn--outline btn--barcode">
								<BarcodeMiniPreview value={card.barcodeValue} format={card.barcodeFormat} />
							</Link>
							<div className="row row--center row--gap-sm">
								<Link href={`/cards/${card.id}/edit`} className="icon-btn" aria-label="Редактировать">
									<svg className="icon-btn__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path
											d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16.5 5a1.4 1.4 0 0 0-2 0L4 15.5V20Z"
											stroke="currentColor"
											strokeWidth="1.8"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<path d="m13.5 6 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
									</svg>
								</Link>
								<button type="button" className="icon-btn icon-btn--danger" aria-label="Удалить" onClick={() => onDelete(card.id)}>
									<svg className="icon-btn__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path
											d="M4 7h16M9 7V5h6v2m-8 0 1 12h8l1-12M10 11v5m4-5v5"
											stroke="currentColor"
											strokeWidth="1.8"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>
				</article>
			))}
		</section>
	);
}
