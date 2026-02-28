"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CardForm } from "@/components/cards/card-form";
import { createCard } from "@/lib/storage/cards-repository";

export default function NewCardPage() {
	const router = useRouter();

	return (
		<div className="app-container app-container--page">
			<div className="stack">
				<Link href="/" className="btn btn--ghost btn--fit">
					Назад
				</Link>
				<h1 className="title-xl">Новая карточка</h1>
				<CardForm
					submitLabel="Сохранить карточку"
					enableBrandPresetPicker
					onSubmit={async (payload) => {
						await createCard(payload);
						router.push("/");
					}}
				/>
			</div>
		</div>
	);
}
