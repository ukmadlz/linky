"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  username: string | null;
  avatarUrl: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name ?? "");
        setBio(data.bio ?? "");
        setUsername(data.username ?? "");
        setAvatarUrl(data.avatarUrl ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, username, avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save settings");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8">
      <h1
        className="mb-8 font-display text-2xl font-semibold"
        style={{ color: "#292d4c" }}
      >
        Settings
      </h1>

      {/* Profile form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-[#292d4c]">
          Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-[#292d4c]"
            >
              Display name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={100}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-[#292d4c] placeholder:text-slate-400 focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
            />
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-[#292d4c]"
            >
              Username
            </label>
            <div className="flex items-center rounded-lg border border-slate-200 focus-within:border-[#5f4dc5] focus-within:ring-2 focus-within:ring-[#5f4dc5]/20">
              <span className="select-none border-r border-slate-200 px-3 py-2.5 text-sm text-slate-400">
                linky.page/
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                maxLength={50}
                pattern="[a-z0-9_-]+"
                className="flex-1 rounded-r-lg bg-transparent px-3 py-2.5 text-sm text-[#292d4c] placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Lowercase letters, numbers, hyphens, underscores only
            </p>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="mb-1.5 block text-sm font-medium text-[#292d4c]"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself"
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-[#292d4c] placeholder:text-slate-400 focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {bio.length}/500
            </p>
          </div>

          {/* Avatar URL */}
          <div>
            <label
              htmlFor="avatarUrl"
              className="mb-1.5 block text-sm font-medium text-[#292d4c]"
            >
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-[#292d4c] placeholder:text-slate-400 focus:border-[#5f4dc5] focus:outline-none focus:ring-2 focus:ring-[#5f4dc5]/20"
            />
          </div>

          {/* Error / success feedback */}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Settings saved!
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#5f4dc5] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Account section */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-[#292d4c]">Account</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#292d4c]">Email address</p>
            <p className="text-sm text-slate-500">{profile?.email}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            Read-only
          </span>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Danger zone (Phase 2) */}
      <div className="mt-6 rounded-xl border border-red-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-red-700">
          Danger zone
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Account deletion is coming in a future update.
        </p>
        <button
          disabled
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-400 opacity-50 cursor-not-allowed"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
