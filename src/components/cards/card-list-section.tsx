"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, type MouseEvent, useState } from "react";

import { distanceInKm } from "@/lib/sort/cards-sort";
import { getStoreLogoMeta } from "@/lib/store-logos";
import { ACTIVE_CARD_TRANSITION_NAME, CARD_TILE_TRANSITION_PREFIX } from "@/lib/view-transitions";
import type { DiscountCard, GeoPoint } from "@/types/discount-card";

type ViewTransitionCapableDocument = Document & {
	startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

type CardListSectionProps = {
	title: string;
	cards: DiscountCard[];
	userPosition: GeoPoint | null;
	showDistance: boolean;
};

function distanceLabel(card: DiscountCard, userPosition: GeoPoint | null) {
	if (!userPosition || !card.storeCoords) {
		return null;
	}

	const km = distanceInKm(userPosition, card.storeCoords);
	return `${km.toFixed(1)} км`;
}

export function CardListSection({ title, cards, userPosition, showDistance }: CardListSectionProps) {
	const router = useRouter();
	const [activeCardId, setActiveCardId] = useState<string | null>(null);

	const handleTransitionNavigation = (
		event: MouseEvent<HTMLAnchorElement>,
		cardId: string,
		href: string,
	) => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}

		const viewTransitionDocument = document as ViewTransitionCapableDocument;
		if (typeof viewTransitionDocument.startViewTransition !== "function") {
			return;
		}

		event.preventDefault();
		setActiveCardId(cardId);

		requestAnimationFrame(() => {
			const transition = viewTransitionDocument.startViewTransition?.(() => {
				router.push(href);
			});
			void transition?.finished.finally(() => {
				setActiveCardId(null);
			});
		});
	};

	return (
		<section className="stack">
			{title ? <h2 className="title-lg">{title}</h2> : null}
			{cards.length === 0 ? <p className="text-muted">Нет карточек в этом разделе.</p> : null}
			{cards.length > 0 ? (
				<div className="wallet-list">
					{cards.map((card) => {
						const storeLogo = getStoreLogoMeta(card.storeName, card.storeBrandKey);
						const logoSrc = card.storeLogoDataUrl ?? storeLogo.src;
						const distance = showDistance ? distanceLabel(card, userPosition) : null;

						return (
							<Link
								key={card.id}
								href={`/cards/${card.id}/use`}
								className="wallet-card"
								prefetch
								data-active-card={activeCardId === card.id ? "true" : "false"}
								onClick={(event) => {
									handleTransitionNavigation(event, card.id, `/cards/${card.id}/use`);
								}}
								style={
									{
										"--card-accent": card.color,
										viewTransitionName:
											activeCardId === card.id
												? ACTIVE_CARD_TRANSITION_NAME
												: `${CARD_TILE_TRANSITION_PREFIX}${card.id}`,
									} as CSSProperties
								}
							>
								<span className="wallet-card__accent" aria-hidden="true" />
								{logoSrc ? (
									<span className="wallet-card__logo" aria-hidden="true">
										<img src={logoSrc} alt="" className="store-logo__img" loading="lazy" />
									</span>
								) : (
									<span className="wallet-card__logo" aria-hidden="true">
										{storeLogo.initials}
									</span>
								)}
								<div className="wallet-card__body">
									<h3 className="wallet-card__name">{card.storeName}</h3>
									{distance ? <p className="wallet-card__meta">{distance}</p> : null}
								</div>
								{card.isFavorite ? (
									<span className="favorite-badge favorite-badge--active" aria-label="Избранная карточка">
										<svg className="favorite-badge__icon" viewBox="0 0 24 24" aria-hidden="true">
											<path
												d="m12 3 2.8 5.7 6.2.9-4.5 4.3 1.1 6.1L12 17.1 6.4 20l1.1-6.1L3 9.6l6.2-.9L12 3Z"
												fill="currentColor"
											/>
										</svg>
									</span>
								) : null}
							</Link>
						);
					})}
				</div>
			) : null}
		</section>
	);
}
