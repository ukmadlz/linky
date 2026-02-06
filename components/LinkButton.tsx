"use client";

import { Link } from "@/lib/db/schema";
import { useState } from "react";
import { usePostHog } from "posthog-js/react";

interface LinkButtonProps {
  link: Link;
  buttonColor: string;
  buttonTextColor: string;
}

export default function LinkButton({ link, buttonColor, buttonTextColor }: LinkButtonProps) {
  const [isClicking, setIsClicking] = useState(false);
  const posthog = usePostHog();

  const handleClick = async () => {
    setIsClicking(true);

    // Track click with PostHog
    posthog?.capture("link_clicked", {
      linkId: link.id,
      linkTitle: link.title,
      linkUrl: link.url,
    });

    // Track click in database
    try {
      await fetch("/api/clicks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: link.id }),
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }

    // Open link
    window.open(link.url, "_blank", "noopener,noreferrer");

    setTimeout(() => setIsClicking(false), 200);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
      style={{
        backgroundColor: buttonColor,
        color: buttonTextColor,
        opacity: isClicking ? 0.8 : 1,
      }}
    >
      {link.icon && <span className="text-xl">{link.icon}</span>}
      <span>{link.title}</span>
    </button>
  );
}
