import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";

export const metadata: Metadata = {
	title: "Скидочные карты",
	description: "Офлайн PWA для хранения и использования скидочных карт",
	manifest: "/manifest.webmanifest",
	applicationName: "Скидочные карты",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ru">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
				<meta name="theme-color" media="(prefers-color-scheme: light)" content="#1976d2" />
				<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1420" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
			</head>
			<body className="antialiased">
				<ServiceWorkerRegister />
				{children}
			</body>
		</html>
	);
}
