import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

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
				<meta name="theme-color" content="#1976d2" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ServiceWorkerRegister />
				{children}
			</body>
		</html>
	);
}
