type PrefetchableRouter = {
	prefetch: (href: string) => void;
};

function runWhenIdle(task: () => void) {
	if (typeof window === "undefined") {
		return;
	}

	const idleWindow = window as Window & {
		requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
	};

	if (typeof idleWindow.requestIdleCallback === "function") {
		idleWindow.requestIdleCallback(() => task(), { timeout: 2_000 });
		return;
	}

	window.setTimeout(task, 200);
}

/** Prefetch RSC/shell для всех card-роутов после загрузки списка из IndexedDB. */
export function prefetchCardRoutes(router: PrefetchableRouter, cardIds: string[]) {
	router.prefetch("/cards/new");

	for (const id of cardIds) {
		router.prefetch(`/cards/${id}/use`);
		router.prefetch(`/cards/${id}/edit`);
	}
}

/** Прогрев тяжёлых JS-чанков в idle, чтобы клик по карточке не ждал сети. */
export function warmCardPageChunks() {
	runWhenIdle(() => {
		void import("@/components/cards/barcode-preview");
		void import("@/components/cards/store-route-map");
		void import("@/components/cards/card-form");
	});
}

/** Просит SW заранее закэшировать HTML shell card-страниц. */
export function precacheCardShellsInServiceWorker(cardIds: string[]) {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
		return;
	}

	const urls = [
		"/",
		"/cards/new",
		"/offline",
		...cardIds.flatMap((id) => [`/cards/${id}/use`, `/cards/${id}/edit`]),
	];

	runWhenIdle(() => {
		const controller = navigator.serviceWorker.controller;
		if (!controller) {
			return;
		}

		controller.postMessage({
			type: "PRECACHE_URLS",
			urls,
		});
	});
}
