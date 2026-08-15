import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import sharp from "sharp";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const STORES_DIR = join(ROOT_DIR, "content", "stores");
const PUBLIC_LOGOS_DIR = join(ROOT_DIR, "public", "store-logos");
const GENERATED_FILE = join(ROOT_DIR, "src", "lib", "stores.generated.ts");
const LOGO_FILE_PATTERN = /^logo\.(svg|png|webp|jpe?g)$/i;
const STORE_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER_FIELDS = new Set(["label", "defaultStoreName", "defaultCardColor", "match"]);
const MAX_LOGO_PX = 256;
const UNICODE_WORD_BOUNDARY =
	String.raw`(?:(?<=^|[^\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?=$|[^\p{L}\p{N}_]))`;

function fail(message) {
	throw new Error(`[build-stores] ${message}`);
}

function parseScalar(value, filePath, lineNumber) {
	const trimmedValue = value.trim();

	if (!trimmedValue) {
		return "";
	}

	if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
		try {
			return JSON.parse(trimmedValue);
		} catch {
			fail(`${filePath}:${lineNumber}: некорректное значение в двойных кавычках.`);
		}
	}

	if (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) {
		return trimmedValue.slice(1, -1).replaceAll("''", "'");
	}

	return trimmedValue;
}

function parseStoreMarkdown(filePath) {
	const source = readFileSync(filePath, "utf8").replaceAll("\r\n", "\n");
	const lines = source.split("\n");

	if (lines[0] !== "---") {
		fail(`${filePath}: файл должен начинаться с YAML frontmatter (---).`);
	}

	const closingMarkerIndex = lines.findIndex((line, index) => index > 0 && line === "---");
	if (closingMarkerIndex === -1) {
		fail(`${filePath}: не найден закрывающий маркер frontmatter (---).`);
	}

	const fields = {};
	let activeListField = null;

	for (const [index, rawLine] of lines.slice(1, closingMarkerIndex).entries()) {
		const lineNumber = index + 2;
		const line = rawLine.trimEnd();
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		const listItemMatch = line.match(/^\s*-\s+(.+)$/);
		if (listItemMatch) {
			if (activeListField !== "match") {
				fail(`${filePath}:${lineNumber}: список разрешён только для поля match.`);
			}

			fields.match.push(parseScalar(listItemMatch[1], filePath, lineNumber));
			continue;
		}

		const fieldMatch = line.match(/^([A-Za-z][A-Za-z0-9]*)\s*:\s*(.*)$/);
		if (!fieldMatch) {
			fail(`${filePath}:${lineNumber}: ожидается поле вида name: value.`);
		}

		const [, fieldName, rawValue] = fieldMatch;
		if (!FRONTMATTER_FIELDS.has(fieldName)) {
			fail(`${filePath}:${lineNumber}: неизвестное поле "${fieldName}".`);
		}

		if (fieldName === "match" && !rawValue.trim()) {
			fields.match = [];
			activeListField = "match";
			continue;
		}

		if (activeListField) {
			activeListField = null;
		}

		fields[fieldName] = parseScalar(rawValue, filePath, lineNumber);
	}

	const description = lines
		.slice(closingMarkerIndex + 1)
		.join("\n")
		.trim();

	for (const fieldName of FRONTMATTER_FIELDS) {
		if (!(fieldName in fields)) {
			fail(`${filePath}: отсутствует обязательное поле "${fieldName}".`);
		}
	}

	if (typeof fields.label !== "string" || !fields.label.trim()) {
		fail(`${filePath}: поле label должно быть непустой строкой.`);
	}

	if (typeof fields.defaultStoreName !== "string" || !fields.defaultStoreName.trim()) {
		fail(`${filePath}: поле defaultStoreName должно быть непустой строкой.`);
	}

	if (typeof fields.defaultCardColor !== "string" || !/^#[0-9a-f]{6}$/i.test(fields.defaultCardColor)) {
		fail(`${filePath}: defaultCardColor должен быть HEX-цветом формата #RRGGBB.`);
	}

	if (!Array.isArray(fields.match) || fields.match.length === 0) {
		fail(`${filePath}: поле match должно содержать хотя бы один regex-шаблон.`);
	}

	for (const [index, pattern] of fields.match.entries()) {
		if (typeof pattern !== "string" || !pattern) {
			fail(`${filePath}: match[${index}] должен быть непустой строкой.`);
		}

		try {
			new RegExp(pattern.replaceAll("\\b", UNICODE_WORD_BOUNDARY), "iu");
		} catch (error) {
			fail(`${filePath}: match[${index}] содержит некорректный regex (${error.message}).`);
		}
	}

	if (!description) {
		fail(`${filePath}: добавьте описание магазина после frontmatter.`);
	}

	return {
		label: fields.label.trim(),
		defaultStoreName: fields.defaultStoreName.trim(),
		defaultCardColor: fields.defaultCardColor,
		match: fields.match,
		description,
	};
}

function readStores() {
	let entries;

	try {
		entries = readdirSync(STORES_DIR, { withFileTypes: true });
	} catch {
		fail(`каталог ${STORES_DIR} не найден.`);
	}

	const storeDirectories = entries
		.filter((entry) => entry.isDirectory())
		.sort((left, right) => left.name.localeCompare(right.name));

	if (storeDirectories.length === 0) {
		fail(`в ${STORES_DIR} нет папок магазинов.`);
	}

	const keys = new Set();
	return storeDirectories.map((directory) => {
		const { name: key } = directory;

		if (!STORE_KEY_PATTERN.test(key) || key === "custom") {
			fail(`некорректный ключ магазина "${key}". Используйте kebab-case; ключ custom зарезервирован.`);
		}

		if (keys.has(key)) {
			fail(`дублирующийся ключ магазина "${key}".`);
		}
		keys.add(key);

		const storeDirectory = join(STORES_DIR, key);
		const markdownFile = join(storeDirectory, "store.md");
		const logoFiles = readdirSync(storeDirectory, { withFileTypes: true })
			.filter((entry) => entry.isFile() && LOGO_FILE_PATTERN.test(entry.name))
			.map((entry) => entry.name);

		if (logoFiles.length !== 1) {
			fail(`${storeDirectory}: ожидается ровно один логотип logo.svg/png/webp/jpg/jpeg.`);
		}

		const logoExtension = extname(logoFiles[0]).slice(1).toLowerCase();
		const metadata = parseStoreMarkdown(markdownFile);

		return {
			key,
			...metadata,
			logoSrc: `/store-logos/${key}.${logoExtension}`,
			logoFile: join(storeDirectory, logoFiles[0]),
			logoExtension,
		};
	});
}

function generateRuntimeModule(stores) {
	const serializedStores = JSON.stringify(
		stores,
		(property, value) => (property === "logoFile" || property === "logoExtension" ? undefined : value),
		2,
	)
		.replaceAll("\u2028", "\\u2028")
		.replaceAll("\u2029", "\\u2029");

	return `/**
 * Этот файл создан scripts/build-stores.mjs.
 * Не редактируйте его вручную — изменяйте content/stores/<key>/store.md.
 */
export const GENERATED_STORE_BRANDS = ${serializedStores} as const;

export type GeneratedStoreBrandKey = (typeof GENERATED_STORE_BRANDS)[number]["key"];
`;
}

async function writeLogo(store) {
	const destination = join(PUBLIC_LOGOS_DIR, `${store.key}.${store.logoExtension}`);
	if (store.logoExtension === "svg") {
		copyFileSync(store.logoFile, destination);
		return;
	}

	try {
		let image = sharp(store.logoFile);
		const meta = await image.metadata();
		if ((meta.width ?? 0) > MAX_LOGO_PX || (meta.height ?? 0) > MAX_LOGO_PX) {
			image = image.resize(MAX_LOGO_PX, MAX_LOGO_PX, {
				fit: "inside",
				withoutEnlargement: true,
			});
		}

		if (store.logoExtension === "png") {
			await image.png({ compressionLevel: 9, palette: true }).toFile(destination);
			return;
		}

		if (store.logoExtension === "webp") {
			await image.webp({ quality: 82 }).toFile(destination);
			return;
		}

		if (store.logoExtension === "jpg" || store.logoExtension === "jpeg") {
			await image.jpeg({ quality: 82, mozjpeg: true }).toFile(destination);
			return;
		}
	} catch (error) {
		console.warn(`[build-stores] не удалось сжать ${store.logoFile}: ${error.message}. Копирую исходник.`);
	}

	copyFileSync(store.logoFile, destination);
}

async function buildStores() {
	const stores = readStores();

	rmSync(PUBLIC_LOGOS_DIR, { recursive: true, force: true });
	mkdirSync(PUBLIC_LOGOS_DIR, { recursive: true });

	for (const store of stores) {
		await writeLogo(store);
	}

	mkdirSync(join(ROOT_DIR, "src", "lib"), { recursive: true });
	writeFileSync(GENERATED_FILE, generateRuntimeModule(stores), "utf8");

	console.log(`[build-stores] Сгенерировано магазинов: ${stores.length}.`);
}

await buildStores();
