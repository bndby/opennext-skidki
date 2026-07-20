import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			// Легитимные синхронизации с внешним состоянием (гео, online, canvas)
			"react-hooks/set-state-in-effect": "off",
		},
	},
	globalIgnores([
		".next/**",
		".open-next/**",
		"out/**",
		"build/**",
		"cloudflare-env.d.ts",
		"next-env.d.ts",
	]),
]);

export default eslintConfig;
