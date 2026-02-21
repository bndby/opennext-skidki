"use client";

import { Alert, Stack, Typography } from "@mui/material";
import JsBarcode from "jsbarcode";
import { useEffect, useMemo, useRef, useState } from "react";

type BarcodePreviewProps = {
	value: string;
	format: string;
};

const JS_BARCODE_FORMATS = new Set([
	"CODE128",
	"CODE39",
	"EAN13",
	"EAN8",
	"UPC",
	"UPCA",
	"ITF14",
]);

export function BarcodePreview({ value, format }: BarcodePreviewProps) {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const [error, setError] = useState<string | null>(null);

	const normalizedFormat = useMemo(() => {
		const upper = format.toUpperCase();
		return JS_BARCODE_FORMATS.has(upper) ? upper : "CODE128";
	}, [format]);

	useEffect(() => {
		if (!svgRef.current || !value.trim()) {
			return;
		}

		try {
			JsBarcode(svgRef.current, value, {
				format: normalizedFormat,
				displayValue: true,
				lineColor: "#000000",
				background: "#ffffff",
				height: 100,
				margin: 12,
				fontSize: 16,
			});
			setError(null);
		} catch {
			setError("Не удалось отрисовать штрихкод. Проверьте значение.");
		}
	}, [normalizedFormat, value]);

	return (
		<Stack spacing={1}>
			<Typography variant="subtitle1">Штрихкод для кассы</Typography>
			<svg ref={svgRef} />
			{error ? <Alert severity="warning">{error}</Alert> : null}
			<Typography variant="caption" color="text.secondary">
				Формат: {normalizedFormat}
			</Typography>
		</Stack>
	);
}
