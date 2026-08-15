import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";

export const metadata: Metadata = {
	title: "Скидочные карты",
	description: "Офлайн PWA для хранения и использования скидочных карт",
	manifest: "/manifest.webmanifest",
	applicationName: "Скидочные карты",
	icons: {
		icon: [
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
	},
	appleWebApp: {
		capable: true,
		title: "Карты",
		statusBarStyle: "black-translucent",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#1976d2" },
		{ media: "(prefers-color-scheme: dark)", color: "#0f1420" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ru">
			<body className="antialiased">
				<ServiceWorkerRegister />
				{children}
			</body>
		</html>
	);
}
