import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/posthog/server", () => ({
  captureServerEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue({ userId: null }),
}));

// Mock resolveEmbed to control what the route returns in tests
const resolveEmbedMock = vi.fn();

vi.mock("@/lib/embeds/resolve", () => ({
  resolveEmbed: (...a: unknown[]) => resolveEmbedMock(...a),
}));

import { POST } from "@/app/api/embeds/resolve/route";
import { NextRequest } from "next/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/embeds/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/embeds/resolve", () => {
  it("returns YouTube iframe embed data for a YouTube URL", async () => {
    resolveEmbedMock.mockResolvedValueOnce({
      originalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      providerName: "YouTube",
      embedType: "iframe",
      iframeUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      aspectRatio: "16/9",
    });

    const req = makeRequest({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.embedType).toBe("iframe");
    expect(body.providerName).toBe("YouTube");
    expect(body.iframeUrl).toContain("youtube");
  });

  it("returns a custom fallback for an unrecognized URL", async () => {
    resolveEmbedMock.mockResolvedValueOnce({
      originalUrl: "https://example.com",
      providerName: "Unknown",
      embedType: "custom",
    });

    const req = makeRequest({ url: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.embedType).toBe("custom");
  });

  it("returns 400 when url field is missing", async () => {
    const req = makeRequest({ notAUrl: "oops" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when url is not a valid URL", async () => {
    const req = makeRequest({ url: "not-a-url" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
