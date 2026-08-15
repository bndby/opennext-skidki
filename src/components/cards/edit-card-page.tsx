"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CardForm } from "@/components/cards/card-form";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { getCardById, removeCard, updateCard } from "@/lib/storage/cards-repository";
import type { DiscountCard } from "@/types/discount-card";

export function EditCardPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [card, setCard] = useState<DiscountCard | null>(null);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		getCardById(params.id)
			.then((result) => {
				if (!result) {
					setNotFound(true);
					return;
				}
				setCard(result);
			})
			.catch(() => setNotFound(true));
	}, [params.id]);

	if (notFound) {
		return (
			<div className="app-container app-container--page">
				<TopAppBar title="Редактирование" backHref="/" />
				<p className="alert alert--error">Карточка не найдена.</p>
			</div>
		);
	}

	if (!card) {
		return (
			<div className="app-container app-container--page">
				<TopAppBar title="Редактирование" backHref="/" />
				<p className="text-muted text-small">Загрузка</p>
			</div>
		);
	}

	return (
		<div className="app-container app-container--page">
			<div className="stack">
				<TopAppBar title="Редактирование" backHref={`/cards/${card.id}/use`} />
				<CardForm
					initialCard={card}
					submitLabel="Сохранить"
					enableBrandPresetPicker
					onSubmit={async (payload) => {
						await updateCard(card.id, payload);
						router.push("/");
					}}
				/>
				<button
					type="button"
					className="btn btn--danger-outline btn--block"
					onClick={async () => {
						const isConfirmed = window.confirm("Удалить карточку?");
						if (!isConfirmed) {
							return;
						}

						await removeCard(card.id);
						router.push("/");
					}}
				>
					Удалить
				</button>
			</div>
		</div>
	);
}
