"use client";

import JsBarcode from "jsbarcode";
import { useEffect, useMemo, useRef } from "react";

/** Пропсы компонента {@link BarcodeMiniPreview}. */
type BarcodeMiniPreviewProps = {
	/** Строковое значение, которое будет закодировано в штрихкод. */
	value: string;
	/** Формат штрихкода (например, "CODE128", "EAN13"). */
	format: string;
};

/**
 * Множество форматов штрихкодов, поддерживаемых библиотекой JsBarcode.
 * Если переданный формат не входит в этот список — используется CODE128.
 */
const JS_BARCODE_FORMATS = new Set([
	"CODE128",
	"CODE39",
	"EAN13",
	"EAN8",
	"UPC",
	"UPCA",
	"ITF14",
]);

/**
 * Компонент мини-превью штрихкода.
 *
 * Рендерит SVG-элемент с закодированным значением,
 * используя библиотеку JsBarcode. Подходит для отображения
 * компактных штрихкодов в списках карточек.
 *
 * @param props — {@link BarcodeMiniPreviewProps}
 * @example
 * <BarcodeMiniPreview value="4601234567890" format="EAN13" />
 */
export function BarcodeMiniPreview({ value, format }: BarcodeMiniPreviewProps) {
	const svgRef = useRef<SVGSVGElement | null>(null);

	/**
	 * Нормализует формат штрихкода: приводит к верхнему регистру
	 * и проверяет наличие в поддерживаемом списке.
	 * Если формат не поддерживается — возвращает "CODE128" по умолчанию.
	 */
	const normalizedFormat = useMemo(() => {
		const upper = format.toUpperCase();
		return JS_BARCODE_FORMATS.has(upper) ? upper : "CODE128";
	}, [format]);

	/**
	 * Генерирует SVG-штрихкод при изменении значения или формата.
	 * При невалидной комбинации формата/значения ошибки подавляются —
	 * компонент просто ничего не отрисовывает.
	 */
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
				margin: 2,
				width: 1.2,
			});
		} catch {
			// Невалидный формат/значение — в списке просто скрываем превью.
		}
	}, [normalizedFormat, value]);

	return (
		<div className="barcode-mini-preview">
			<svg ref={svgRef} />
		</div>
	);
}
