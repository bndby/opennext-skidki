"use client";

import JsBarcode from "jsbarcode";
import { useEffect, useMemo, useRef, useState } from "react";

import { toJsBarcodeFormat } from "@/lib/barcode/formats";

type BarcodePreviewProps = {
	value: string;
	format: string;
};

export function BarcodePreview({ value, format }: BarcodePreviewProps) {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const [error, setError] = useState<string | null>(null);

	const jsBarcodeFormat = useMemo(() => toJsBarcodeFormat(format), [format]);

	useEffect(() => {
		if (!svgRef.current || !value.trim()) {
			return;
		}

		if (!jsBarcodeFormat) {
			svgRef.current.replaceChildren();
			setError("Этот формат штрихкода нельзя нарисовать. Покажите кассиру числовое значение.");
			return;
		}

		try {
			JsBarcode(svgRef.current, value, {
				format: jsBarcodeFormat,
				displayValue: false,
				lineColor: "#000000",
				background: "#ffffff",
				height: 96,
				margin: 8,
				width: 2,
			});
			setError(null);
		} catch {
			svgRef.current.replaceChildren();
			setError("Не удалось отрисовать штрихкод. Проверьте значение и формат.");
		}
	}, [jsBarcodeFormat, value]);

	return (
		<div className="stack stack--tight">
			<svg ref={svgRef} style={{ display: jsBarcodeFormat && !error ? "block" : "none", margin: "0 auto", maxWidth: "100%" }} />
			<p className="barcode-value">{value}</p>
			{error ? <p className="alert alert--warning">{error}</p> : null}
		</div>
	);
}
