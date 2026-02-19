import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
      style={{ backgroundColor: "#f7f5f4" }}
    >
      <div className="text-center">
        <p className="text-6xl font-bold" style={{ color: "#5f4dc5" }}>
          404
        </p>
        <h1
          className="font-display mt-4 text-2xl font-semibold"
          style={{ color: "#292d4c" }}
        >
          Page not found
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#67697f" }}>
          This Linky page doesn&apos;t exist or isn&apos;t published yet.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:brightness-110"
          style={{ backgroundColor: "#5f4dc5" }}
        >
          Go to Linky
        </Link>
      </div>
    </div>
  );
}
