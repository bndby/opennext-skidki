"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) {
			return;
		}

		if (process.env.NODE_ENV !== "production") {
			(async () => {
				try {
					const registrations = await navigator.serviceWorker.getRegistrations();
					await Promise.all(registrations.map((registration) => registration.unregister()));

					if ("caches" in window) {
						const cacheNames = await window.caches.keys();
						await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
					}

					// One-time reload to fully drop stale cached chunks in dev.
					if (!sessionStorage.getItem("dev-sw-cleanup-done")) {
						sessionStorage.setItem("dev-sw-cleanup-done", "1");
						window.location.reload();
					}
				} catch {
					// Ignore cleanup errors in dev mode.
				}
			})();
			return;
		}

		navigator.serviceWorker.register("/sw.js").catch(() => undefined);
	}, []);

	return null;
}
