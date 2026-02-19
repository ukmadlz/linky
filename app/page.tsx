import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="font-serif text-5xl font-bold text-foreground mb-4">
          Linky
        </h1>
        <p className="text-muted-foreground text-xl mb-8 max-w-md">
          Your all-in-one link-in-bio platform with integrations, embeds, and
          beautiful theming.
        </p>
        <Link
          href="/login"
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:scale-[1.02] transition-all duration-200"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
