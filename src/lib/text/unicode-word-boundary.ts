/**
 * Unicode-aware equivalent of regex `\b`.
 * JavaScript `\b` only treats `[A-Za-z0-9_]` as word characters, so it never
 * matches around Cyrillic store names like «Евроопт».
 */
export const UNICODE_WORD_BOUNDARY =
	String.raw`(?:(?<=^|[^\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?=$|[^\p{L}\p{N}_]))`;

export function compileStoreMatchPattern(pattern: string): RegExp {
	const source = pattern.replaceAll("\\b", UNICODE_WORD_BOUNDARY);
	return new RegExp(source, "iu");
}
