"use client";

import { useEffect, useRef } from "react";
import type { Layer, Map as LeafletMap } from "leaflet";

import type { GeoPoint } from "@/types/discount-card";

type StoreRouteMapProps = {
	userPosition: GeoPoint;
	storePosition: GeoPoint;
	routePath: GeoPoint[];
	storeName: string;
};

export function StoreRouteMap({ userPosition, storePosition, routePath, storeName }: StoreRouteMapProps) {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapInstanceRef = useRef<LeafletMap | null>(null);
	const layersRef = useRef<Layer[]>([]);

	useEffect(() => {
		let cancelled = false;

		async function setupMap() {
			if (!mapContainerRef.current) {
				return;
			}

			const leafletModule = await import("leaflet");
			if (cancelled) {
				return;
			}

			const L = leafletModule.default;

			if (!mapInstanceRef.current) {
				const map = L.map(mapContainerRef.current, {
					zoomControl: true,
				});

				L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution: "&copy; OpenStreetMap contributors",
				}).addTo(map);

				mapInstanceRef.current = map;
			}

			const map = mapInstanceRef.current;
			map.invalidateSize();

			layersRef.current.forEach((layer) => {
				map.removeLayer(layer);
			});
			layersRef.current = [];

			const userMarker = L.circleMarker([userPosition.lat, userPosition.lon], {
				radius: 8,
				color: "#2563eb",
				fillColor: "#2563eb",
				fillOpacity: 0.9,
				weight: 2,
			}).bindTooltip("Вы", { direction: "top" });

			const storeMarker = L.circleMarker([storePosition.lat, storePosition.lon], {
				radius: 8,
				color: "#16a34a",
				fillColor: "#16a34a",
				fillOpacity: 0.95,
				weight: 2,
			}).bindTooltip(storeName, { direction: "top" });

			userMarker.addTo(map);
			storeMarker.addTo(map);
			layersRef.current.push(userMarker, storeMarker);

			if (routePath.length > 1) {
				const polyline = L.polyline(
					routePath.map((point) => [point.lat, point.lon]),
					{
						color: "#1976d2",
						weight: 4,
						opacity: 0.85,
					},
				);
				polyline.addTo(map);
				layersRef.current.push(polyline);
				map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
				requestAnimationFrame(() => {
					map.invalidateSize();
				});
				return;
			}

			const bounds = L.latLngBounds(
				[userPosition.lat, userPosition.lon],
				[storePosition.lat, storePosition.lon],
			);
			map.fitBounds(bounds.pad(0.4), { padding: [20, 20] });
			requestAnimationFrame(() => {
				map.invalidateSize();
			});
		}

		setupMap().catch(() => {
			// Silent fallback: map remains empty when tiles/routing are unavailable.
		});

		return () => {
			cancelled = true;
		};
	}, [routePath, storeName, storePosition.lat, storePosition.lon, userPosition.lat, userPosition.lon]);

	useEffect(() => {
		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, []);

	return <div ref={mapContainerRef} className="store-map-block__frame" aria-label="Карта маршрута до магазина" />;
}
