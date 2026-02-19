/**
 * Small "Made with Linky" footer badge shown on free pages.
 * Links back to the Linky marketing site.
 */
export function LinkyBranding() {
  return (
    <footer className="mt-8 flex justify-center pb-6">
      <a
        href="https://biohasl.ink"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
        style={{
          backgroundColor: "rgba(0,0,0,0.06)",
          color: "var(--text-color)",
          opacity: 0.6,
        }}
      >
        <span>Made with</span>
        <span className="font-semibold" style={{ color: "var(--btn-color)" }}>
          biohasl.ink
        </span>
      </a>
    </footer>
  );
}
