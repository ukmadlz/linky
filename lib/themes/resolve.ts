import type { ThemeConfig } from "./types";
import { themePresets } from "./presets";

/**
 * Resolve a theme by merging a preset with user overrides.
 * Falls back to "default" preset if the themeId is not found.
 */
export function resolveTheme(
  themeId: string,
  overrides: Partial<ThemeConfig> = {}
): ThemeConfig {
  const preset = themePresets[themeId] ?? themePresets.default;
  return { ...preset, ...overrides };
}
