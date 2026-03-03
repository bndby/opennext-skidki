"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState } from "react";

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
	isOnline: boolean;
};

function distanceLabel(card: DiscountCard, userPosition: GeoPoint | null) {
	if (!userPosition || !card.storeCoords) {
		return null;
	}

	const km = distanceInKm(userPosition, card.storeCoords);
	return `${km.toFixed(1)} км`;
}

function hexToRgba(hex: string, alpha: number) {
	const normalizedHex = hex.replace("#", "").trim();
	if (!/^[\da-fA-F]{3}$|^[\da-fA-F]{6}$/.test(normalizedHex)) {
		return `rgba(25, 118, 210, ${alpha})`;
	}

	const fullHex =
		normalizedHex.length === 3
			? normalizedHex
					.split("")
					.map((part) => part + part)
					.join("")
			: normalizedHex;

	const intValue = Number.parseInt(fullHex, 16);
	const red = (intValue >> 16) & 255;
	const green = (intValue >> 8) & 255;
	const blue = intValue & 255;

	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function CardListSection({
	title,
	cards,
	userPosition,
	showDistance,
	isOnline,
}: CardListSectionProps) {
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
		const canStartTransition = typeof viewTransitionDocument.startViewTransition === "function";

		if (!canStartTransition) {
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
		<section className="stack section-list">
			{title ? <h2 className="title-lg title-lg--offset">{title}</h2> : null}
			{cards.length === 0 ? <p className="text-muted">Нет карточек в этом разделе.</p> : null}
			{cards.length > 0 ? (
				<div className="card-menu-list">
					{cards.map((card) => {
						const storeLogo = getStoreLogoMeta(card.storeName, card.storeBrandKey);
						const logoSrc = card.storeLogoDataUrl ?? storeLogo.src;
						const distance = showDistance ? distanceLabel(card, userPosition) : null;

						return (
							<Link
								key={card.id}
								href={`/cards/${card.id}/use`}
								className="card-menu-item"
								data-active-card={activeCardId === card.id ? "true" : "false"}
								onClick={(event) => {
									handleTransitionNavigation(event, card.id, `/cards/${card.id}/use`);
								}}
								style={{
									backgroundImage: `radial-gradient(130% 130% at 100% 50%, ${hexToRgba(card.color, 0.54)} 0%, ${hexToRgba(card.color, 0.2)} 38%, ${hexToRgba(card.color, 0)} 74%)`,
									viewTransitionName:
										activeCardId === card.id
											? ACTIVE_CARD_TRANSITION_NAME
											: `${CARD_TILE_TRANSITION_PREFIX}${card.id}`,
								}}
							>
								<span
									className={`favorite-badge card-menu-item__favorite ${card.isFavorite ? "favorite-badge--active" : ""}`}
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
								{logoSrc ? (
									<span className="store-logo card-menu-item__logo store-logo--plain" aria-hidden="true">
										<img src={logoSrc} alt="" className="store-logo__img" loading="lazy" />
									</span>
								) : null}
								<div className="card-menu-item__content">
									<h3 className="title-md card-menu-item__store-name">{card.storeName}</h3>
								</div>
								{distance ? (
									<div className={`card-menu-item__distance-block ${isOnline ? "card-menu-item__distance-block--online" : ""}`}>
										<svg className="card-menu-item__distance-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
											<path
												d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
												stroke="currentColor"
												strokeWidth="1.8"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
											<circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
										</svg>
										<div className="card-menu-item__distance-text">{distance}</div>
									</div>
								) : null}
							</Link>
						);
					})}
				</div>
			) : null}
		</section>
	);
}
