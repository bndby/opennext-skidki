const CACHE_NAME = "discount-cards-v1";
const APP_SHELL = ["/", "/offline", "/manifest.webmanifest", "/favicon.svg"];

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

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const cloned = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
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
				const cloned = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
				return response;
			});
		}),
	);
});
