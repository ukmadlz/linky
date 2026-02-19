import Link from "next/link";

const FEATURES = [
  {
    icon: "🔗",
    title: "Smart Link Blocks",
    description:
      "Add links, embeds, social icons, dividers, and custom HTML. Every block is drag-and-drop reorderable.",
  },
  {
    icon: "🎨",
    title: "Beautiful Themes",
    description:
      "Choose from 5 hand-crafted presets — then customize every color, font, and button style to match your brand.",
  },
  {
    icon: "📊",
    title: "Real-time Analytics",
    description:
      "See exactly which links get clicked, where your audience comes from, and track milestones as you grow.",
  },
  {
    icon: "🎵",
    title: "Rich Embeds",
    description:
      "Auto-detect YouTube, Spotify, Vimeo, SoundCloud and more. Paste a URL — biohasl.ink does the rest.",
  },
  {
    icon: "🔒",
    title: "Content Gating",
    description:
      "Add age verification or acknowledgment gates to sensitive links. Privacy-first — no DOB stored.",
  },
  {
    icon: "⚡",
    title: "Fast by Default",
    description:
      "Built on Next.js with ISR. Public pages are statically cached and served at the edge.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f5f4" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 lg:px-12">
        <span className="font-display text-xl font-bold" style={{ color: "#292d4c" }}>
          biohasl.ink
        </span>
        <Link
          href="/login"
          className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:brightness-110"
          style={{ backgroundColor: "#5f4dc5" }}
        >
          Get started
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center overflow-hidden px-6 py-24 text-center lg:py-32">
        {/* Background glow */}
        <div
          className="animate-float pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "#5f4dc5" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-64 w-64 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: "#4d65ff" }}
        />

        <div className="relative">
          <span
            className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ backgroundColor: "#5f4dc515", color: "#5f4dc5" }}
          >
            Your link-in-bio, reimagined
          </span>

          <h1
            className="font-display mx-auto max-w-3xl text-5xl font-bold leading-tight lg:text-6xl"
            style={{ color: "#292d4c" }}
          >
            Everything you are,{" "}
            <span
              className="bg-gradient-to-r from-[#5f4dc5] to-[#4d65ff] bg-clip-text text-transparent"
            >
              one link
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: "#67697f" }}
          >
            Create a stunning link-in-bio page with embeds, integrations, and
            full theming. Share your world — one beautiful page.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
              style={{ backgroundColor: "#5f4dc5" }}
            >
              Create your page — it&apos;s free
            </Link>
            <a
              href="#features"
              className="rounded-xl border px-8 py-3.5 text-base font-medium transition-colors"
              style={{ borderColor: "#d1d5db", color: "#292d4c" }}
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2
              className="font-display text-3xl font-bold lg:text-4xl"
              style={{ color: "#292d4c" }}
            >
              Everything you need
            </h2>
            <p className="mt-3 text-lg" style={{ color: "#67697f" }}>
              All the tools to grow and connect with your audience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{icon}</div>
                <h3
                  className="mb-2 text-base font-semibold"
                  style={{ color: "#292d4c" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#67697f" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="px-6 py-20 lg:px-12">
        <div
          className="mx-auto max-w-3xl rounded-3xl px-8 py-16 text-center"
          style={{ backgroundColor: "#5f4dc5" }}
        >
          <h2 className="font-display text-3xl font-bold text-white lg:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-lg text-white/80">
            Create your free biohasl.ink page in under 2 minutes.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold transition-all duration-200 hover:scale-[1.03]"
            style={{ color: "#5f4dc5" }}
          >
            Get started for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t border-slate-200 px-6 py-8 text-center text-sm"
        style={{ color: "#67697f" }}
      >
        <p>
          © {new Date().getFullYear()} biohasl.ink. Built with ♥ for creators.
        </p>
      </footer>
    </div>
  );
}
