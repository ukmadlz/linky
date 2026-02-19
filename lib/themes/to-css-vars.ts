import type { ThemeConfig } from "./types";
import {
	BLOCK_SPACING_VALUES,
	BUTTON_RADIUS_VALUES,
	MAX_WIDTH_VALUES,
} from "./types";

/**
 * Convert a ThemeConfig to CSS custom property key-value pairs.
 * These are applied inline on the page container.
 */
export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
	return {
		"--bg-color": theme.backgroundColor,
		"--text-color": theme.textColor,
		"--heading-color": theme.headingColor,
		"--btn-color": theme.buttonColor,
		"--btn-text-color": theme.buttonTextColor,
		"--btn-radius": BUTTON_RADIUS_VALUES[theme.buttonRadius] ?? "0.5rem",
		"--btn-style": theme.buttonStyle,
		"--social-icon-color": theme.socialIconColor,
		"--max-width": MAX_WIDTH_VALUES[theme.maxWidth] ?? "480px",
		"--block-spacing": BLOCK_SPACING_VALUES[theme.blockSpacing] ?? "0.75rem",
	};
}

/**
 * Convert CSS var record to an inline style string for the page container.
 */
export function cssVarsToStyle(vars: Record<string, string>): string {
	return Object.entries(vars)
		.map(([key, value]) => `${key}: ${value}`)
		.join("; ");
}
