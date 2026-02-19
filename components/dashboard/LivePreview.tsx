"use client";

import type { CSSProperties } from "react";
import { themeToCssVars } from "@/lib/themes/to-css-vars";
import type { ThemeConfig } from "@/lib/themes/types";

interface LivePreviewProps {
	theme: ThemeConfig;
	displayName?: string;
	bio?: string;
}

/**
 * Scaled-down phone-frame preview of a public page with the given theme applied.
 */
export function LivePreview({
	theme,
	displayName = "Your Name",
	bio = "Your bio here",
}: LivePreviewProps) {
	const cssVars = themeToCssVars(theme) as CSSProperties;

	const btnRadius =
		{
			none: "0",
			sm: "4px",
			md: "8px",
			lg: "12px",
			full: "9999px",
		}[theme.buttonRadius] ?? "8px";

	const btnStyle = theme.buttonStyle;

	function linkStyle(): CSSProperties {
		const base: CSSProperties = {
			display: "block",
			width: "100%",
			padding: "10px 16px",
			borderRadius: btnRadius,
			textAlign: "center",
			fontWeight: 500,
			fontSize: "13px",
			textDecoration: "none",
			transition: "all 0.2s",
		};

		switch (btnStyle) {
			case "filled":
				return {
					...base,
					backgroundColor: theme.buttonColor,
					color: theme.buttonTextColor,
				};
			case "outline":
				return {
					...base,
					backgroundColor: "transparent",
					color: theme.buttonColor,
					border: `2px solid ${theme.buttonColor}`,
				};
			case "soft":
				return {
					...base,
					backgroundColor: `${theme.buttonColor}22`,
					color: theme.buttonColor,
				};
			case "shadow":
				return {
					...base,
					backgroundColor: "#ffffff",
					color: theme.textColor,
					boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
				};
			default:
				return base;
		}
	}

	return (
		<div className="flex justify-center">
			{/* Phone frame */}
			<div
				className="relative overflow-hidden rounded-[2rem] shadow-2xl"
				style={{
					width: "240px",
					height: "480px",
					border: "8px solid #1e2235",
				}}
			>
				{/* Notch */}
				<div
					className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-xl"
					style={{ width: "80px", height: "20px", backgroundColor: "#1e2235" }}
				/>

				{/* Page content */}
				<div
					className="h-full overflow-y-auto"
					style={{ ...cssVars, backgroundColor: theme.backgroundColor }}
				>
					<div
						className="flex flex-col items-center px-4 pb-8 pt-8"
						style={{ color: theme.textColor }}
					>
						{/* Avatar */}
						<div
							className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold shadow"
							style={{
								backgroundColor: theme.buttonColor,
								color: theme.buttonTextColor,
							}}
						>
							YN
						</div>

						{/* Name */}
						<p
							className="text-sm font-semibold"
							style={{ color: theme.headingColor }}
						>
							{displayName}
						</p>

						{/* Bio */}
						{bio && (
							<p
								className="mt-1 text-center text-xs leading-relaxed"
								style={{ color: theme.textColor, opacity: 0.7 }}
							>
								{bio}
							</p>
						)}

						{/* Mock link buttons */}
						<div className="mt-4 w-full space-y-2">
							{["My Website", "Instagram", "Latest Music"].map((label) => (
								<div key={label} style={linkStyle()}>
									{label}
								</div>
							))}
						</div>

						{/* Mock social icons */}
						<div className="mt-4 flex gap-3">
							{["IG", "TW", "YT"].map((icon) => (
								<div
									key={icon}
									className="text-xs font-semibold"
									style={{ color: theme.socialIconColor }}
								>
									{icon}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
