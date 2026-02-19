import { describe, expect, it } from "vitest";
import { themePresets } from "@/lib/themes/presets";
import { themeToCssVars } from "@/lib/themes/to-css-vars";

describe("themeToCssVars", () => {
	const defaultTheme = themePresets.default;
	const vars = themeToCssVars(defaultTheme);

	it("returns all expected CSS variable keys", () => {
		expect(vars).toHaveProperty("--bg-color");
		expect(vars).toHaveProperty("--text-color");
		expect(vars).toHaveProperty("--heading-color");
		expect(vars).toHaveProperty("--btn-color");
		expect(vars).toHaveProperty("--btn-text-color");
		expect(vars).toHaveProperty("--btn-radius");
		expect(vars).toHaveProperty("--btn-style");
		expect(vars).toHaveProperty("--social-icon-color");
		expect(vars).toHaveProperty("--max-width");
		expect(vars).toHaveProperty("--block-spacing");
	});

	it("maps backgroundColor to --bg-color", () => {
		expect(vars["--bg-color"]).toBe(defaultTheme.backgroundColor);
	});

	it("maps textColor to --text-color", () => {
		expect(vars["--text-color"]).toBe(defaultTheme.textColor);
	});

	it("maps buttonColor to --btn-color", () => {
		expect(vars["--btn-color"]).toBe(defaultTheme.buttonColor);
	});

	it("maps buttonTextColor to --btn-text-color", () => {
		expect(vars["--btn-text-color"]).toBe(defaultTheme.buttonTextColor);
	});

	it("maps buttonStyle to --btn-style", () => {
		expect(vars["--btn-style"]).toBe(defaultTheme.buttonStyle);
	});

	it("maps socialIconColor to --social-icon-color", () => {
		expect(vars["--social-icon-color"]).toBe(defaultTheme.socialIconColor);
	});
});
