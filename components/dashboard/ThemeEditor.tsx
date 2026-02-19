"use client";

import { themePresets } from "@/lib/themes/presets";
import type { ThemeConfig } from "@/lib/themes/types";

const PRESET_SWATCHES: Record<string, { bg: string; accent: string; label: string }> = {
  default: { bg: "#f7f5f4", accent: "#5f4dc5", label: "Default" },
  midnight: { bg: "#060818", accent: "#7c6de0", label: "Midnight" },
  forest: { bg: "#f0f4f0", accent: "#2d6a2d", label: "Forest" },
  sunset: { bg: "#fef5ee", accent: "#e85d04", label: "Sunset" },
  minimal: { bg: "#ffffff", accent: "#000000", label: "Minimal" },
};

const GOOGLE_FONTS = [
  "DM Sans",
  "Inter",
  "Playfair Display",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Nunito",
  "Raleway",
  "Merriweather",
  "Poppins",
  "Source Sans 3",
];

interface ThemeEditorProps {
  themeId: string;
  overrides: Partial<ThemeConfig>;
  currentTheme: ThemeConfig;
  onPresetChange: (presetId: string) => void;
  onOverrideChange: (overrides: Partial<ThemeConfig>) => void;
  onSave: () => void;
  saving: boolean;
}

export function ThemeEditor({
  themeId,
  overrides,
  currentTheme,
  onPresetChange,
  onOverrideChange,
  onSave,
  saving,
}: ThemeEditorProps) {
  function update<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) {
    onOverrideChange({ ...overrides, [key]: value });
  }

  return (
    <div className="space-y-6">
      {/* Preset picker */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#292d4c]">Theme Preset</h3>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(PRESET_SWATCHES).map(([id, { bg, accent, label }]) => (
            <button
              key={id}
              onClick={() => onPresetChange(id)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="h-12 w-full rounded-lg border-2 transition-all"
                style={{
                  backgroundColor: bg,
                  borderColor: themeId === id ? accent : "#e2e8f0",
                  boxShadow: themeId === id ? `0 0 0 2px ${accent}40` : "none",
                }}
              >
                <div
                  className="mx-auto mt-2 h-2 w-8 rounded"
                  style={{ backgroundColor: accent }}
                />
              </div>
              <span className="text-xs text-slate-500">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom overrides */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#292d4c]">Customize</h3>

        <div className="space-y-5">
          {/* Colors */}
          <details open>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
              Colors
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(
                [
                  { key: "backgroundColor", label: "Background" },
                  { key: "textColor", label: "Text" },
                  { key: "headingColor", label: "Heading" },
                  { key: "buttonColor", label: "Button" },
                  { key: "buttonTextColor", label: "Button Text" },
                  { key: "socialIconColor", label: "Social Icons" },
                ] as { key: keyof ThemeConfig; label: string }[]
              ).map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-600">{label}</span>
                  <input
                    type="color"
                    value={(currentTheme[key] as string) || "#000000"}
                    onChange={(e) => update(key, e.target.value as never)}
                    className="h-8 w-12 cursor-pointer rounded border border-slate-200"
                  />
                </label>
              ))}
            </div>
          </details>

          {/* Button style */}
          <details>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
              Button Style
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["filled", "outline", "soft", "shadow"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update("buttonStyle", s)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    currentTheme.buttonStyle === s
                      ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </details>

          {/* Button radius */}
          <details>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
              Button Radius
            </summary>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {(["none", "sm", "md", "lg", "full"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("buttonRadius", r)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors ${
                    currentTheme.buttonRadius === r
                      ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </details>

          {/* Font */}
          <details>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
              Font
            </summary>
            <div className="mt-3">
              <select
                value={currentTheme.fontFamily}
                onChange={(e) => update("fontFamily", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {GOOGLE_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </details>

          {/* Layout */}
          <details>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
              Layout
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Max Width
                </label>
                <div className="flex gap-2">
                  {(["sm", "md", "lg"] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => update("maxWidth", w)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium uppercase transition-colors ${
                        currentTheme.maxWidth === w
                          ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {w === "sm" ? "480px" : w === "md" ? "560px" : "640px"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Block Spacing
                </label>
                <div className="flex gap-2">
                  {(["tight", "normal", "relaxed"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => update("blockSpacing", s)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        currentTheme.blockSpacing === s
                          ? "border-[#5f4dc5] bg-[#5f4dc5]/10 text-[#5f4dc5]"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-lg bg-[#5f4dc5] py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save theme"}
      </button>
    </div>
  );
}
