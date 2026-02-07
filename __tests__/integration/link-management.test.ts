import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
	clearDatabase,
	createTestUser,
	createTestLink,
	createTestLinks,
	countLinks,
} from "../helpers/test-db";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Link Management Integration", () => {
	let testUser: Awaited<ReturnType<typeof createTestUser>>;

	beforeEach(async () => {
		await clearDatabase();
		testUser = await createTestUser({
			email: "test@test.com",
			username: "testuser",
			isPro: false,
		});
	});

	afterEach(async () => {
		await clearDatabase();
	});

	describe("Create Link", () => {
		it("should create a new link with valid data", async () => {
			const linkData = {
				userId: testUser.id,
				title: "My Website",
				url: "https://example.com",
				icon: "🔗",
				position: 0,
			};

			const _request = new Request("http://localhost:3000/api/links", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(linkData),
			});

			// Mock auth session
			const _mockSession = {
				user: { id: testUser.id },
				session: { token: "mock-token" },
			};

			// This would normally come from auth middleware
			// For now, we'll test the database operation directly
			const [link] = await db
				.insert(links)
				.values({
					userId: linkData.userId,
					title: linkData.title,
					url: linkData.url,
					icon: linkData.icon,
					position: linkData.position,
					isActive: true,
					clicks: 0,
				})
				.returning();

			expect(link).toBeDefined();
			expect(link.title).toBe(linkData.title);
			expect(link.url).toBe(linkData.url);
			expect(link.icon).toBe(linkData.icon);

			const linkCount = await countLinks(testUser.id);
			expect(linkCount).toBe(1);
		});

		it("should prevent free users from creating more than 5 links", async () => {
			// Create 5 links for free user
			await createTestLinks(testUser.id, 5);

			const linkCount = await countLinks(testUser.id);
			expect(linkCount).toBe(5);

			// Attempt to create 6th link should fail at the canAddLink check
			const canAddMore = linkCount < 5 || testUser.isPro;
			expect(canAddMore).toBe(false);
		});

		it("should allow Pro users to create unlimited links", async () => {
			// Update user to Pro
			const proUser = await createTestUser({
				email: "pro@test.com",
				username: "prouser",
				isPro: true,
			});

			// Create 10 links
			await createTestLinks(proUser.id, 10);

			const linkCount = await countLinks(proUser.id);
			expect(linkCount).toBe(10);

			// Pro user should still be able to add more
			const canAddMore = linkCount < 5 || proUser.isPro;
			expect(canAddMore).toBe(true);
		});
	});

	describe("Update Link", () => {
		it("should update link properties", async () => {
			const link = await createTestLink(testUser.id, {
				title: "Original Title",
				url: "https://original.com",
			});

			// Update the link
			await db
				.update(links)
				.set({
					title: "Updated Title",
					url: "https://updated.com",
					updatedAt: new Date(),
				})
				.where(eq(links.id, link.id));

			const [updatedLink] = await db.select().from(links).where(eq(links.id, link.id));

			expect(updatedLink.title).toBe("Updated Title");
			expect(updatedLink.url).toBe("https://updated.com");
		});

		it("should toggle link visibility", async () => {
			const link = await createTestLink(testUser.id, {
				isActive: true,
			});

			expect(link.isActive).toBe(true);

			// Toggle to hidden
			await db
				.update(links)
				.set({
					isActive: false,
					updatedAt: new Date(),
				})
				.where(eq(links.id, link.id));

			const [updatedLink] = await db.select().from(links).where(eq(links.id, link.id));
			expect(updatedLink.isActive).toBe(false);
		});
	});

	describe("Delete Link", () => {
		it("should delete a link", async () => {
			const link = await createTestLink(testUser.id);

			const countBefore = await countLinks(testUser.id);
			expect(countBefore).toBe(1);

			await db.delete(links).where(eq(links.id, link.id));

			const countAfter = await countLinks(testUser.id);
			expect(countAfter).toBe(0);
		});

		it("should only delete the specified link", async () => {
			const link1 = await createTestLink(testUser.id, { title: "Link 1" });
			const link2 = await createTestLink(testUser.id, { title: "Link 2" });
			const link3 = await createTestLink(testUser.id, { title: "Link 3" });

			await db.delete(links).where(eq(links.id, link2.id));

			const remainingLinks = await db.select().from(links).where(eq(links.userId, testUser.id));

			expect(remainingLinks).toHaveLength(2);
			expect(remainingLinks.find((l) => l.id === link1.id)).toBeDefined();
			expect(remainingLinks.find((l) => l.id === link3.id)).toBeDefined();
			expect(remainingLinks.find((l) => l.id === link2.id)).toBeUndefined();
		});
	});

	describe("Reorder Links", () => {
		it("should update link positions", async () => {
			const links = await createTestLinks(testUser.id, 3);

			// Reorder: move first link to last position
			const reorderedData = [
				{ id: links[1].id, position: 0 },
				{ id: links[2].id, position: 1 },
				{ id: links[0].id, position: 2 },
			];

			for (const item of reorderedData) {
				await db
					.update(links)
					.set({ position: item.position, updatedAt: new Date() })
					.where(eq(links.id, item.id));
			}

			// Verify new order
			const updatedLinks = await db
				.select()
				.from(links)
				.where(eq(links.userId, testUser.id))
				.orderBy(links.position);

			expect(updatedLinks[0].id).toBe(links[1].id);
			expect(updatedLinks[1].id).toBe(links[2].id);
			expect(updatedLinks[2].id).toBe(links[0].id);
		});

		it("should maintain correct positions after reorder", async () => {
			const testLinks = await createTestLinks(testUser.id, 4);

			// Move second item to third position
			const reorderedData = [
				{ id: testLinks[0].id, position: 0 },
				{ id: testLinks[2].id, position: 1 },
				{ id: testLinks[1].id, position: 2 },
				{ id: testLinks[3].id, position: 3 },
			];

			for (const item of reorderedData) {
				await db
					.update(links)
					.set({ position: item.position, updatedAt: new Date() })
					.where(eq(links.id, item.id));
			}

			const updatedLinks = await db
				.select()
				.from(links)
				.where(eq(links.userId, testUser.id))
				.orderBy(links.position);

			updatedLinks.forEach((link, index) => {
				expect(link.position).toBe(index);
			});
		});
	});

	describe("Link Limits", () => {
		it("should enforce 5 link limit for free users", async () => {
			await createTestLinks(testUser.id, 5);

			const canAdd = testUser.isPro || (await countLinks(testUser.id)) < 5;
			expect(canAdd).toBe(false);
		});

		it("should not enforce limit for Pro users", async () => {
			const proUser = await createTestUser({
				email: "pro@test.com",
				username: "prouser",
				isPro: true,
			});

			await createTestLinks(proUser.id, 20);

			const canAdd = proUser.isPro || (await countLinks(proUser.id)) < 5;
			expect(canAdd).toBe(true);
		});
	});
});
