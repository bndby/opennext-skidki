"use client";

import Link from "next/link";

export default function OfflinePage() {
	return (
		<div className="app-container app-container--offline">
			<div className="stack">
				<h1 className="title-xl">Офлайн-режим</h1>
				<p className="text-muted">
					Интернет недоступен. Вы можете продолжить использовать сохранённые локально карточки.
				</p>
				<Link href="/" className="btn btn--primary">
					Открыть карточки
				</Link>
			</div>
		</div>
	);
}
