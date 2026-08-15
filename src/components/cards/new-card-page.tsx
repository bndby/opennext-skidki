"use client";

import { useRouter } from "next/navigation";

import { CardForm } from "@/components/cards/card-form";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { createCard } from "@/lib/storage/cards-repository";

export function NewCardPage() {
	const router = useRouter();

	return (
		<div className="app-container app-container--page">
			<div className="stack">
				<TopAppBar title="Новая карточка" backHref="/" />
				<CardForm
					submitLabel="Сохранить"
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
