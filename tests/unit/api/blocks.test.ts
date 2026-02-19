import { describe, it, expect, vi } from "vitest";

const { mockUser, mockPage, mockBlock } = vi.hoisted(() => {
  const mockUser = {
    id: "user-1",
    email: "alice@example.com",
    username: "alice",
    name: "Alice",
    bio: null,
    avatarUrl: null,
    workosUserId: "wos-1",
    isPro: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockPage = {
    id: "page-1",
    userId: "user-1",
    slug: "alice",
    title: null,
    description: null,
    isPublished: true,
    themeId: "default",
    themeOverrides: {},
    seoTitle: null,
    seoDescription: null,
    ogImageUrl: null,
    milestonesSent: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockBlock = {
    id: "block-1",
    pageId: "page-1",
    parentId: null,
    type: "link" as const,
    position: 0,
    isVisible: true,
    data: { url: "https://example.com", title: "Example" },
    scheduledStart: null,
    scheduledEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return { mockUser, mockPage, mockBlock };
});

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue(mockUser),
}));

const getPageByIdMock = vi.fn().mockResolvedValue(mockPage);
const getAllBlocksByPageIdMock = vi.fn().mockResolvedValue([mockBlock]);
const createBlockMock = vi.fn().mockResolvedValue(mockBlock);

vi.mock("@/lib/db/queries", () => ({
  getPageById: (...a: unknown[]) => getPageByIdMock(...a),
  getAllBlocksByPageId: (...a: unknown[]) => getAllBlocksByPageIdMock(...a),
  createBlock: (...a: unknown[]) => createBlockMock(...a),
  getBlockById: vi.fn(),
  updateBlock: vi.fn(),
  deleteBlock: vi.fn(),
  reorderBlocks: vi.fn(),
}));

vi.mock("@/lib/posthog/server", () => ({
  captureServerEvent: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/pages/[pageId]/blocks/route";

function makeParams(pageId: string) {
  return { params: Promise.resolve({ pageId }) };
}

describe("POST /api/pages/[pageId]/blocks", () => {
  it("creates a link block and returns 201", async () => {
    const req = new Request("http://localhost/api/pages/page-1/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "link",
        data: { url: "https://example.com", title: "Example" },
      }),
    });
    const res = await POST(req, makeParams("page-1"));
    expect(res.status).toBe(201);
  });

  it("returns 422 for invalid (unknown) block type", async () => {
    const req = new Request("http://localhost/api/pages/page-1/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "unknown_type",
        data: {},
      }),
    });
    const res = await POST(req, makeParams("page-1"));
    // unknown_type fails the Zod enum validation → 422
    expect(res.status).toBe(422);
  });

  it("returns 422 when block data fails Zod schema", async () => {
    const req = new Request("http://localhost/api/pages/page-1/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "link",
        data: { title: "Missing URL" }, // url is required
      }),
    });
    const res = await POST(req, makeParams("page-1"));
    expect(res.status).toBe(422);
  });

  it("returns 404 when page belongs to another user", async () => {
    getPageByIdMock.mockResolvedValueOnce({
      ...mockPage,
      userId: "other-user",
    });
    const req = new Request("http://localhost/api/pages/page-99/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "link",
        data: { url: "https://example.com", title: "Test" },
      }),
    });
    const res = await POST(req, makeParams("page-99"));
    expect(res.status).toBe(404);
  });
});
