"use client";

import Link from "next/link";

export default function OfflinePage() {
	return (
		<div className="app-container app-container--offline">
			<div className="stack">
				<h1 className="title-xl">Нет сети</h1>
				<p className="text-muted">Сохранённые карточки доступны без интернета.</p>
				<Link href="/" className="btn btn--primary btn--block">
					К карточкам
				</Link>
			</div>
		</div>
	);
}
