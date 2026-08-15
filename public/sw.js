const CACHE_NAME = "discount-cards-v6";
const APP_SHELL = ["/", "/offline", "/cards/new", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(APP_SHELL);
		}),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys.map((key) => {
					if (key !== CACHE_NAME) {
						return caches.delete(key);
					}
					return Promise.resolve();
				}),
			);
		}),
	);
	self.clients.claim();
});

self.addEventListener("message", (event) => {
	const data = event.data;
	if (!data || data.type !== "PRECACHE_URLS" || !Array.isArray(data.urls)) {
		return;
	}

	event.waitUntil(
		caches.open(CACHE_NAME).then(async (cache) => {
			await Promise.all(
				data.urls.map(async (url) => {
					if (typeof url !== "string" || !url.startsWith("/")) {
						return;
					}

					try {
						const absoluteUrl = new URL(url, self.location.origin).toString();
						const response = await fetch(absoluteUrl, { credentials: "same-origin" });
						if (response.ok) {
							await cache.put(absoluteUrl, response.clone());
						}
					} catch {
						// Ignore individual precache failures.
					}
				}),
			);
		}),
	);
});

function isCardAppNavigate(url) {
	return (
		url.pathname === "/" ||
		url.pathname === "/offline" ||
		url.pathname === "/cards/new" ||
		url.pathname.startsWith("/cards/")
	);
}

function isNextStaticAsset(url) {
	return url.pathname.startsWith("/_next/static/");
}

function isApiRequest(url) {
	return url.pathname.startsWith("/api/");
}

async function cachePut(request, response) {
	if (!response.ok) {
		return;
	}

	const cache = await caches.open(CACHE_NAME);
	await cache.put(request, response.clone());
}

self.addEventListener("fetch", (event) => {
	const request = event.request;

	if (request.method !== "GET") {
		return;
	}

	const url = new URL(request.url);
	const isSameOrigin = url.origin === self.location.origin;

	if (!isSameOrigin) {
		return;
	}

	if (isApiRequest(url)) {
		event.respondWith(fetch(request));
		return;
	}

	// JS/CSS чанки: network-first, иначе iOS PWA может навсегда застрять
	// на устаревшем/битом chunk после деплоя (как «Загрузка сканера...»).
	if (isNextStaticAsset(url)) {
		event.respondWith(
			(async () => {
				try {
					const response = await fetch(request);
					event.waitUntil(cachePut(request, response));
					return response;
				} catch {
					const cached = await caches.match(request);
					return cached ?? Response.error();
				}
			})(),
		);
		return;
	}

	if (request.mode === "navigate" && isCardAppNavigate(url)) {
		event.respondWith(
			(async () => {
				const cached = await caches.match(request);
				if (cached) {
					event.waitUntil(
						fetch(request)
							.then((response) => cachePut(request, response))
							.catch(() => undefined),
					);
					return cached;
				}

				try {
					const response = await fetch(request);
					event.waitUntil(cachePut(request, response));
					return response;
				} catch {
					const offlinePage = await caches.match("/offline");
					return offlinePage ?? Response.error();
				}
			})(),
		);
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					event.waitUntil(cachePut(request, response));
					return response;
				})
				.catch(async () => {
					const cachedPage = await caches.match(request);
					if (cachedPage) {
						return cachedPage;
					}
					return caches.match("/offline");
				}),
		);
		return;
	}

	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) {
				return cached;
			}

			return fetch(request).then((response) => {
				event.waitUntil(cachePut(request, response));
				return response;
			});
		}),
	);
});
