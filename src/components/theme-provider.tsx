"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { PropsWithChildren } from "react";

const theme = createTheme({
	palette: {
		mode: "light",
		primary: {
			main: "#1976d2",
		},
		background: {
			default: "#f3f5f9",
			paper: "#ffffff",
		},
	},
	shape: {
		borderRadius: 16,
	},
	typography: {
		fontFamily:
			'-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	},
	components: {
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 20,
					boxShadow: "0 6px 18px rgba(21, 42, 83, 0.08)",
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 14,
					textTransform: "none",
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					borderRadius: 12,
				},
			},
		},
	},
});

export function AppThemeProvider({ children }: PropsWithChildren) {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
}
