"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

type BarcodeScannerProps = {
	onDetected: (value: string, format: string) => void;
};

export function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isScanning || !videoRef.current) {
			return;
		}

		let stopped = false;
		const reader = new BrowserMultiFormatReader();
		let stopControls: { stop: () => void } | null = null;

		(async () => {
			try {
				stopControls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
					if (!result || stopped) {
						return;
					}

					stopped = true;
					stopControls?.stop();
					setIsScanning(false);
					onDetected(result.getText(), result.getBarcodeFormat().toString());
				});
			} catch {
				setError("Не удалось запустить камеру. Проверьте разрешение браузера.");
				setIsScanning(false);
			}
		})();

		return () => {
			stopped = true;
			stopControls?.stop();
		};
	}, [isScanning, onDetected]);

	return (
		<div className="stack">
			<h3 className="title-md">Сканирование штрихкода</h3>
			{error ? <p className="alert alert--warning">{error}</p> : null}
			<div className="scanner-preview">
				<video ref={videoRef} style={{ width: "100%", display: isScanning ? "block" : "none" }} />
				{!isScanning ? <p className="scanner-preview__label">Камера не запущена</p> : null}
			</div>
			<div className="row row--gap-sm">
				<button
					type="button"
					className="btn btn--primary"
					onClick={() => {
						setError(null);
						setIsScanning(true);
					}}
					disabled={isScanning}
				>
					Запустить камеру
				</button>
				{isScanning ? (
					<button type="button" className="btn btn--outline" onClick={() => setIsScanning(false)}>
						Остановить
					</button>
				) : null}
			</div>
			{isScanning ? (
				<div className="row row--center row--gap-sm">
					<span className="spinner" aria-hidden="true" />
					<p className="text-small">Наведите камеру на штрихкод</p>
				</div>
			) : null}
		</div>
	);
}
