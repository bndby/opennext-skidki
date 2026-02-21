"use client";

import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
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
		<Stack spacing={1.5}>
			<Typography variant="subtitle1">Сканирование штрихкода</Typography>
			{error ? <Alert severity="warning">{error}</Alert> : null}
			<Box
				sx={{
					border: "1px dashed",
					borderColor: "divider",
					borderRadius: 2,
					overflow: "hidden",
					bgcolor: "black",
					minHeight: 220,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<video ref={videoRef} style={{ width: "100%", display: isScanning ? "block" : "none" }} />
				{!isScanning ? <Typography color="white">Камера не запущена</Typography> : null}
			</Box>
			<Stack direction="row" spacing={1}>
				<Button
					variant="contained"
					onClick={() => {
						setError(null);
						setIsScanning(true);
					}}
					disabled={isScanning}
				>
					Запустить камеру
				</Button>
				{isScanning ? (
					<Button variant="outlined" onClick={() => setIsScanning(false)}>
						Остановить
					</Button>
				) : null}
			</Stack>
			{isScanning ? (
				<Stack direction="row" spacing={1} alignItems="center">
					<CircularProgress size={18} />
					<Typography variant="body2">Наведите камеру на штрихкод</Typography>
				</Stack>
			) : null}
		</Stack>
	);
}
