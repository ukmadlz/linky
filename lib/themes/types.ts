export interface ThemeConfig {
	/** Page background color (hex) */
	backgroundColor: string;
	/** Body text color (hex) */
	textColor: string;
	/** Heading text color (hex) */
	headingColor: string;
	/** Link button style variant */
	buttonStyle: "filled" | "outline" | "soft" | "shadow";
	/** Button background color (hex) */
	buttonColor: string;
	/** Button text color (hex) */
	buttonTextColor: string;
	/** Button border radius preset */
	buttonRadius: "none" | "sm" | "md" | "lg" | "full";
	/** Body/UI font family name */
	fontFamily: string;
	/** Social icon color (hex) */
	socialIconColor: string;
	/** Page max-width constraint */
	maxWidth: "sm" | "md" | "lg";
	/** Spacing between blocks */
	blockSpacing: "tight" | "normal" | "relaxed";
}

export const BUTTON_RADIUS_VALUES: Record<ThemeConfig["buttonRadius"], string> =
	{
		none: "0",
		sm: "0.25rem",
		md: "0.5rem",
		lg: "0.75rem",
		full: "9999px",
	};

export const MAX_WIDTH_VALUES: Record<ThemeConfig["maxWidth"], string> = {
	sm: "480px",
	md: "560px",
	lg: "640px",
};

export const BLOCK_SPACING_VALUES: Record<ThemeConfig["blockSpacing"], string> =
	{
		tight: "0.5rem",
		normal: "0.75rem",
		relaxed: "1.25rem",
	};
