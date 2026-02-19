import Image from "next/image";

interface PageHeaderProps {
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  username: string | null;
}

/**
 * Public page header: avatar, display name, bio.
 * Uses theme CSS variables for colors.
 */
export function PageHeader({ name, bio, avatarUrl, username }: PageHeaderProps) {
  const displayName = name || username || "Bio User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex flex-col items-center gap-4 pb-6 text-center">
      {/* Avatar */}
      <div className="relative h-24 w-24 overflow-hidden rounded-full shadow-md ring-2 ring-white/20">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes="96px"
            priority
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-2xl font-semibold"
            style={{ backgroundColor: "var(--btn-color)", color: "var(--btn-text-color)" }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Display name */}
      <div className="block-text">
        <h1
          className="font-display text-2xl font-semibold leading-tight"
          style={{ color: "var(--heading-color)" }}
        >
          {displayName}
        </h1>
      </div>

      {/* Bio */}
      {bio && (
        <p
          className="max-w-xs text-sm leading-relaxed"
          style={{ color: "var(--text-color)", opacity: 0.8 }}
        >
          {bio}
        </p>
      )}
    </header>
  );
}
