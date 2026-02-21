"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CardForm } from "@/components/cards/card-form";
import { getCardById, removeCard, updateCard } from "@/lib/storage/cards-repository";
import type { DiscountCard } from "@/types/discount-card";

export default function EditCardPage() {
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
				<h1 className="title-xl">Редактирование карточки</h1>
				<CardForm
					initialCard={card}
					submitLabel="Сохранить изменения"
					onSubmit={async (payload) => {
						await updateCard(card.id, payload);
						router.push("/");
					}}
				/>
				<button
					type="button"
					className="btn btn--danger-outline"
					onClick={async () => {
						const isConfirmed = window.confirm("Удалить карточку?");
						if (!isConfirmed) {
							return;
						}

						await removeCard(card.id);
						router.push("/");
					}}
				>
					Удалить карточку
				</button>
			</div>
		</div>
	);
}
