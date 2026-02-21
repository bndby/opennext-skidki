"use client";

import JsBarcode from "jsbarcode";
import { useEffect, useMemo, useRef } from "react";

type BarcodeMiniPreviewProps = {
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

export function BarcodeMiniPreview({ value, format }: BarcodeMiniPreviewProps) {
	const svgRef = useRef<SVGSVGElement | null>(null);

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
				displayValue: false,
				lineColor: "#000000",
				background: "#ffffff",
				height: 32,
				margin: 6,
				width: 1.2,
			});
		} catch {
			// Невалидный формат/значение - в списке просто скрываем превью.
		}
	}, [normalizedFormat, value]);

	return (
		<div className="barcode-mini-preview">
			<svg ref={svgRef} />
		</div>
	);
}
