"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import type { User } from "@/lib/db/schema";

interface TopBarProps {
  user: User;
}

export function TopBar({ user }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const displayName = user.name || user.username || user.email;
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-[#f7f5f4] px-6">
      {/* Page title placeholder — filled by each page */}
      <div />

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 hover:bg-black/5"
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#5f4dc5] text-xs font-semibold text-white">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <span className="hidden font-medium text-[#292d4c] sm:block">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>

        {/* Dropdown */}
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
