"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { toStoredBarcodeFormat } from "@/lib/barcode/formats";

type BarcodeScannerProps = {
	onDetected: (value: string, format: string) => void;
};

function isAppleTouchDevice() {
	if (typeof navigator === "undefined") {
		return false;
	}

	return (
		/iPad|iPhone|iPod/i.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
	);
}

async function requestCameraWithTimeout(timeoutMs = 8_000) {
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new Error("getUserMedia недоступен");
	}

	const cameraPromise = navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false,
	});

	let timeoutId = 0;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = window.setTimeout(() => {
			reject(new Error("Таймаут ожидания камеры (iOS не ответил на getUserMedia)"));
		}, timeoutMs);
	});

	try {
		return await Promise.race([cameraPromise, timeoutPromise]);
	} finally {
		window.clearTimeout(timeoutId);
	}
}

/**
 * Сканер штрихкода.
 *
 * На iOS live-getUserMedia часто зависает без UI, поэтому основной путь —
 * нативное фото через `<input capture="environment">` + decode из изображения.
 * Live-камера остаётся дополнительной кнопкой.
 */
export function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const onDetectedRef = useRef(onDetected);
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [isDecodingPhoto, setIsDecodingPhoto] = useState(false);
	const preferPhotoCapture = isAppleTouchDevice();

	useEffect(() => {
		onDetectedRef.current = onDetected;
	}, [onDetected]);

	useEffect(() => {
		if (!isScanning) {
			return;
		}

		const video = videoRef.current;
		if (!video) {
			setIsScanning(false);
			setStatus(null);
			setError("Не удалось инициализировать превью камеры.");
			return;
		}

		let stopped = false;
		let stopControls: { stop: () => void } | null = null;
		const reader = new BrowserMultiFormatReader();

		video.setAttribute("playsinline", "true");
		video.setAttribute("webkit-playsinline", "true");
		video.muted = true;
		video.playsInline = true;

		(async () => {
			try {
				setStatus("Открываем поток камеры...");
				stopControls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
					if (!result || stopped) {
						return;
					}

					stopped = true;
					stopControls?.stop();
					setIsScanning(false);
					setStatus(null);
					onDetectedRef.current(result.getText(), toStoredBarcodeFormat(result.getBarcodeFormat()));
				});
				setStatus("Наведите камеру на штрихкод");
			} catch (cause) {
				if (stopped) {
					return;
				}

				const message = cause instanceof Error ? cause.message : "Неизвестная ошибка";
				setError(`Не удалось запустить live-камеру: ${message}. Используйте фото штрихкода.`);
				setIsScanning(false);
				setStatus(null);
			}
		})();

		return () => {
			stopped = true;
			stopControls?.stop();
			video.srcObject = null;
		};
	}, [isScanning]);

	async function handleLiveCameraClick() {
		setError(null);
		setStatus("Запрашиваем доступ к камере...");

		try {
			const unlockStream = await requestCameraWithTimeout();
			unlockStream.getTracks().forEach((track) => track.stop());
			setIsScanning(true);
			setStatus("Запускаем сканер...");
		} catch (cause) {
			const name = cause instanceof DOMException ? cause.name : "Error";
			const message = cause instanceof Error ? cause.message : "Неизвестная ошибка";
			setIsScanning(false);
			setStatus(null);
			setError(
				`Live-камера недоступна (${name}: ${message}). На iOS надёжнее «Сфотографировать штрихкод».`,
			);
		}
	}

	async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";

		if (!file) {
			return;
		}

		setError(null);
		setIsDecodingPhoto(true);
		setStatus("Распознаём штрихкод на фото...");

		const objectUrl = URL.createObjectURL(file);
		const reader = new BrowserMultiFormatReader();

		try {
			const result = await reader.decodeFromImageUrl(objectUrl);
			onDetectedRef.current(result.getText(), toStoredBarcodeFormat(result.getBarcodeFormat()));
			setStatus(null);
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : "штрихкод не найден";
			setError(`Не удалось распознать штрихкод на фото: ${message}`);
			setStatus(null);
		} finally {
			URL.revokeObjectURL(objectUrl);
			setIsDecodingPhoto(false);
		}
	}

	return (
		<div className="stack">
			<h3 className="title-md">Сканер</h3>

			{error ? <p className="alert alert--warning">{error}</p> : null}
			{status ? (
				<div className="row row--center row--gap-sm">
					<span className="spinner" aria-hidden="true" />
					<p className="text-small">{status}</p>
				</div>
			) : null}

			<div className="scanner-preview">
				<video
					ref={videoRef}
					className="scanner-preview__video"
					muted
					playsInline
					autoPlay
					controls={false}
					disablePictureInPicture
					style={{ display: isScanning ? "block" : "none" }}
				/>
				{!isScanning ? (
					<p className="scanner-preview__label">
						{preferPhotoCapture ? "Сфотографируйте штрихкод" : "Камера не запущена"}
					</p>
				) : null}
			</div>

			<div className="btn-row">
				<label
					className={`btn ${preferPhotoCapture ? "btn--primary" : "btn--outline"}`}
					style={{ cursor: isDecodingPhoto || isScanning ? "not-allowed" : "pointer" }}
				>
					Фото
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						capture="environment"
						className="sr-only"
						disabled={isDecodingPhoto || isScanning}
						onChange={(event) => {
							void handlePhotoSelected(event);
						}}
					/>
				</label>

				<button
					type="button"
					className={preferPhotoCapture ? "btn btn--outline" : "btn btn--primary"}
					onClick={() => {
						void handleLiveCameraClick();
					}}
					disabled={isScanning || isDecodingPhoto}
				>
					Камера
				</button>

				{isScanning ? (
					<button
						type="button"
						className="btn btn--outline"
						onClick={() => {
							setIsScanning(false);
							setStatus(null);
						}}
					>
						Стоп
					</button>
				) : null}
			</div>

			<p className="field__hint">
				На iPhone/iPad используйте «Сфотографировать штрихкод» — так Safari открывает системную камеру
				без getUserMedia.
			</p>
		</div>
	);
}
