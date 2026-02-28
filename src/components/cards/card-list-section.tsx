"use client";

import Link from "next/link";

import { distanceInKm } from "@/lib/sort/cards-sort";
import { getStoreLogoMeta } from "@/lib/store-logos";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";

type CardListSectionProps = {
	title: string;
	cards: DiscountCard[];
	userPosition: GeoPoint | null;
	showDistance: boolean;
	isOnline: boolean;
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
}: CardListSectionProps) {
	return (
		<section className="stack section-list">
			{title ? <h2 className="title-lg title-lg--offset">{title}</h2> : null}
			{cards.length === 0 ? <p className="text-muted">Нет карточек в этом разделе.</p> : null}
			{cards.length > 0 ? (
				<div className="card-menu-list">
					{cards.map((card) => {
						const storeLogo = getStoreLogoMeta(card.storeName, card.storeBrandKey);
						const logoSrc = card.storeLogoDataUrl ?? storeLogo.src;

						return (
							<Link key={card.id} href={`/cards/${card.id}/use`} className="card-menu-item">
								<div className="stack card-menu-item__content">
									<div className="row row--between row--center">
										<div className="row row--center row--gap-sm row--wrap">
											<span className="store-logo" aria-hidden="true">
												{logoSrc ? (
													<img src={logoSrc} alt="" className="store-logo__img" loading="lazy" />
												) : (
													<span className="store-logo__fallback">{storeLogo.initials}</span>
												)}
											</span>
											<h3 className="title-md">{card.storeName}</h3>
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

								</div>
							</Link>
						);
					})}
				</div>
			) : null}
		</section>
	);
}
