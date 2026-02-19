import { describe, expect, it, vi } from "vitest";

const { mockUser, mockPage } = vi.hoisted(() => {
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
		title: "Alice's Page",
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
	return { mockUser, mockPage };
});

vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn().mockResolvedValue(mockUser),
}));

const getPagesByUserIdMock = vi.fn().mockResolvedValue([mockPage]);
const createPageMock = vi.fn().mockResolvedValue(mockPage);
const getPageBySlugMock = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/db/queries", () => ({
	getPagesByUserId: (...a: unknown[]) => getPagesByUserIdMock(...a),
	createPage: (...a: unknown[]) => createPageMock(...a),
	getPageBySlug: (...a: unknown[]) => getPageBySlugMock(...a),
}));

vi.mock("@/lib/posthog/server", () => ({
	captureServerEvent: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/pages/route";

describe("GET /api/pages", () => {
	it("returns the user's pages array", async () => {
		const res = await GET();
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
		expect(body[0].id).toBe("page-1");
	});
});

describe("POST /api/pages", () => {
	it("creates a page and returns 201", async () => {
		getPagesByUserIdMock.mockResolvedValueOnce([]); // no existing pages
		const req = new Request("http://localhost/api/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "My Page" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(201);
	});

	it("returns 409 when provided slug is already taken", async () => {
		getPageBySlugMock.mockResolvedValueOnce(mockPage); // slug conflict
		const req = new Request("http://localhost/api/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slug: "taken-slug" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(409);
	});

	it("returns 422 for invalid slug characters", async () => {
		const req = new Request("http://localhost/api/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slug: "UPPER_CASE" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(422);
	});
});
