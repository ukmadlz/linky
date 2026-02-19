import { describe, expect, it } from "vitest";
import { themePresets } from "@/lib/themes/presets";
import { resolveTheme } from "@/lib/themes/resolve";

describe("resolveTheme", () => {
	it("returns the default preset unchanged when no overrides given", () => {
		const result = resolveTheme("default", {});
		expect(result).toEqual(themePresets.default);
	});

	it("merges overrides onto the midnight preset without wiping other fields", () => {
		const result = resolveTheme("midnight", { buttonColor: "#ff0000" });
		expect(result.buttonColor).toBe("#ff0000");
		// Other midnight fields should remain intact
		expect(result.backgroundColor).toBe(themePresets.midnight.backgroundColor);
		expect(result.buttonStyle).toBe(themePresets.midnight.buttonStyle);
		expect(result.textColor).toBe(themePresets.midnight.textColor);
	});

	it("falls back to the default preset for an unknown themeId", () => {
		const result = resolveTheme("does-not-exist", {});
		expect(result).toEqual(themePresets.default);
	});

	it("sparse overrides do not wipe non-overridden preset fields", () => {
		const result = resolveTheme("forest", { blockSpacing: "relaxed" });
		expect(result.blockSpacing).toBe("relaxed");
		// All other forest fields should be from the preset
		const forest = themePresets.forest;
		expect(result.backgroundColor).toBe(forest.backgroundColor);
		expect(result.fontFamily).toBe(forest.fontFamily);
		expect(result.buttonRadius).toBe(forest.buttonRadius);
	});
});
