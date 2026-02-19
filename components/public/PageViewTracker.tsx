"use client";

import { useEffect } from "react";

interface PageViewTrackerProps {
  pageId: string;
}

/**
 * Fires a page view beacon on mount via sendBeacon.
 * This is a lightweight client component that doesn't block rendering.
 */
export function PageViewTracker({ pageId }: PageViewTrackerProps) {
  useEffect(() => {
    const data = JSON.stringify({ pageId });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/view", new Blob([data], { type: "application/json" }));
    } else {
      fetch("/api/track/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pageId]);

  return null;
}
