import { notFound } from "next/navigation";
import { getBlockById, getPageById } from "@/lib/db/queries";
import { resolveTheme } from "@/lib/themes/resolve";
import { themeToCssVars } from "@/lib/themes/to-css-vars";
import type { LinkBlockData } from "@/lib/blocks/schemas";
import type { ThemeConfig } from "@/lib/themes/types";

interface VerifyPageProps {
  params: Promise<{ blockId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { blockId } = await params;
  const { error } = await searchParams;

  const block = await getBlockById(blockId);

  if (!block) {
    notFound();
  }

  const data = block.data as unknown as LinkBlockData;

  if (!data.verificationEnabled || !data.verificationMode) {
    notFound();
  }

  // Fetch page for theming
  const page = await getPageById(block.pageId);

  let cssVars: Record<string, string> = {};
  if (page) {
    const theme = resolveTheme(
      page.themeId ?? "default",
      (page.themeOverrides as Partial<ThemeConfig>) ?? {}
    );
    cssVars = themeToCssVars(theme);
  }

  const isAge = data.verificationMode === "age";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
      style={{ backgroundColor: cssVars["--bg-color"] || "#f7f5f4" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8 shadow-md"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{
              backgroundColor: `${cssVars["--btn-color"] || "#5f4dc5"}15`,
            }}
          >
            {isAge ? "🔞" : "⚠️"}
          </div>
          <h1
            className="font-display text-xl font-semibold"
            style={{ color: cssVars["--heading-color"] || "#292d4c" }}
          >
            {isAge ? "Age-Restricted Content" : "Mature Content"}
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: cssVars["--text-color"] || "#292d4c", opacity: 0.7 }}
          >
            {isAge
              ? "This link contains age-restricted content. You must be 18 or older to continue."
              : "The following link may contain content not suitable for all audiences."}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error === "underage"
              ? "You must be 18 or older to access this link."
              : "Verification failed. Please try again."}
          </div>
        )}

        <form method="POST" action={`/api/verify/${blockId}`}>
          {isAge ? (
            <>
              {/* Age verification: DOB fields */}
              <p
                className="mb-3 text-xs font-medium"
                style={{ color: cssVars["--text-color"] || "#292d4c" }}
              >
                Enter your date of birth
              </p>
              <div className="mb-5 flex gap-2">
                <select
                  name="day"
                  required
                  className="flex-1 rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: "#e5e7eb" }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Day
                  </option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  name="month"
                  required
                  className="flex-1 rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: "#e5e7eb" }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Month
                  </option>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  name="year"
                  required
                  className="flex-[1.5] rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: "#e5e7eb" }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Year
                  </option>
                  {Array.from(
                    { length: 100 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110"
                style={{
                  backgroundColor: cssVars["--btn-color"] || "#5f4dc5",
                  color: cssVars["--btn-text-color"] || "#ffffff",
                  borderRadius: cssVars["--btn-radius"] || "0.5rem",
                }}
              >
                Continue
              </button>
              <p
                className="mt-4 text-center text-xs"
                style={{ color: cssVars["--text-color"] || "#292d4c", opacity: 0.5 }}
              >
                We do not store your date of birth. Age is verified on your device.
              </p>
            </>
          ) : (
            <>
              {/* Acknowledge mode */}
              <button
                type="submit"
                className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 hover:brightness-110"
                style={{
                  backgroundColor: cssVars["--btn-color"] || "#5f4dc5",
                  color: cssVars["--btn-text-color"] || "#ffffff",
                  borderRadius: cssVars["--btn-radius"] || "0.5rem",
                }}
              >
                Continue
              </button>
              <a
                href="javascript:history.back()"
                className="mt-3 block w-full rounded-lg border py-2.5 text-center text-sm font-medium transition-all duration-200"
                style={{
                  borderColor: "#e5e7eb",
                  color: cssVars["--text-color"] || "#292d4c",
                }}
              >
                Go back
              </a>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
