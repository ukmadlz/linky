import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LinkList from "@/components/dashboard/LinkList";
import type { Link } from "@/lib/db/schema";

// Mock fetch
global.fetch = vi.fn();

describe("LinkList", () => {
	const mockLinks: Link[] = [
		{
			id: "link-1",
			userId: "user-1",
			title: "Link 1",
			url: "https://example1.com",
			icon: "🔗",
			position: 0,
			isActive: true,
			clicks: 10,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: "link-2",
			userId: "user-1",
			title: "Link 2",
			url: "https://example2.com",
			icon: "📱",
			position: 1,
			isActive: false,
			clicks: 5,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: "link-3",
			userId: "user-1",
			title: "Link 3",
			url: "https://example3.com",
			icon: null,
			position: 2,
			isActive: true,
			clicks: 20,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({}),
		} as Response);
	});

	describe("Rendering", () => {
		it("should render all links", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			expect(screen.getByText("Link 1")).toBeInTheDocument();
			expect(screen.getByText("Link 2")).toBeInTheDocument();
			expect(screen.getByText("Link 3")).toBeInTheDocument();
		});

		it("should display link URLs", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			expect(screen.getByText("https://example1.com")).toBeInTheDocument();
			expect(screen.getByText("https://example2.com")).toBeInTheDocument();
			expect(screen.getByText("https://example3.com")).toBeInTheDocument();
		});

		it("should display click counts", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			expect(screen.getByText("10 clicks")).toBeInTheDocument();
			expect(screen.getByText("5 clicks")).toBeInTheDocument();
			expect(screen.getByText("20 clicks")).toBeInTheDocument();
		});

		it("should show icons when present", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			expect(screen.getByText("🔗")).toBeInTheDocument();
			expect(screen.getByText("📱")).toBeInTheDocument();
		});

		it("should show 'Hidden' badge for inactive links", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			const hiddenBadges = screen.getAllByText("Hidden");
			expect(hiddenBadges).toHaveLength(1);
		});

		it("should show empty state when no links", () => {
			render(<LinkList initialLinks={[]} userId="user-1" isPro={false} />);

			expect(screen.getByText(/No links yet/i)).toBeInTheDocument();
		});

		it("should show Add Link button", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			expect(screen.getByRole("button", { name: /add link/i })).toBeInTheDocument();
		});
	});

	describe("Link Actions", () => {
		it("should show Edit button for each link", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			const editButtons = screen.getAllByRole("button", { name: /edit/i });
			expect(editButtons).toHaveLength(3);
		});

		it("should show Delete button for each link", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
			expect(deleteButtons).toHaveLength(3);
		});

		it("should show Hide/Show toggle for each link", () => {
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			expect(screen.getAllByRole("button", { name: /hide/i })).toHaveLength(2);
			expect(screen.getAllByRole("button", { name: /show/i })).toHaveLength(1);
		});
	});

	describe("Toggle Visibility", () => {
		it("should call API to toggle link visibility", async () => {
			const user = userEvent.setup();
			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ ...mockLinks[0], isActive: false }),
			} as Response);

			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			const hideButton = screen.getAllByRole("button", { name: /hide/i })[0];
			await user.click(hideButton);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith("/api/links/link-1", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isActive: false }),
				});
			});
		});
	});

	describe("Delete Link", () => {
		it("should show confirmation dialog before deleting", async () => {
			const user = userEvent.setup();
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			const deleteButton = screen.getAllByRole("button", { name: /delete/i })[0];
			await user.click(deleteButton);

			expect(confirmSpy).toHaveBeenCalledWith('Delete "Link 1"?');
			expect(global.fetch).not.toHaveBeenCalled();

			confirmSpy.mockRestore();
		});

		it("should call API to delete link when confirmed", async () => {
			const user = userEvent.setup();
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			mockFetch.mockResolvedValueOnce({
				ok: true,
			} as Response);

			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			const deleteButton = screen.getAllByRole("button", { name: /delete/i })[0];
			await user.click(deleteButton);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith("/api/links/link-1", {
					method: "DELETE",
				});
			});

			confirmSpy.mockRestore();
		});

		it("should remove link from list after successful deletion", async () => {
			const user = userEvent.setup();
			const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			mockFetch.mockResolvedValueOnce({
				ok: true,
			} as Response);

			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			const deleteButton = screen.getAllByRole("button", { name: /delete/i })[0];
			await user.click(deleteButton);

			await waitFor(() => {
				expect(screen.queryByText("Link 1")).not.toBeInTheDocument();
			});

			expect(screen.getByText("Link 2")).toBeInTheDocument();
			expect(screen.getByText("Link 3")).toBeInTheDocument();

			confirmSpy.mockRestore();
		});
	});

	describe("Add Link", () => {
		it("should show link editor when Add Link is clicked", async () => {
			const user = userEvent.setup();
			render(<LinkList initialLinks={[]} userId="user-1" isPro={true} />);

			const addButton = screen.getByRole("button", { name: /add link/i });
			await user.click(addButton);

			expect(screen.getByText("Add New Link")).toBeInTheDocument();
		});

		it("should allow free users to add up to 5 links", async () => {
			const user = userEvent.setup();
			const fourLinks = mockLinks.slice(0, 2);

			render(<LinkList initialLinks={fourLinks} userId="user-1" isPro={false} />);

			const addButton = screen.getByRole("button", { name: /add link/i });
			await user.click(addButton);

			// Should show editor (no alert)
			expect(screen.getByText("Add New Link")).toBeInTheDocument();
		});

		it("should prevent free users from adding more than 5 links", async () => {
			const user = userEvent.setup();
			const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

			const fiveLinks: Link[] = Array.from({ length: 5 }, (_, i) => ({
				id: `link-${i}`,
				userId: "user-1",
				title: `Link ${i}`,
				url: `https://example${i}.com`,
				icon: null,
				position: i,
				isActive: true,
				clicks: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			render(<LinkList initialLinks={fiveLinks} userId="user-1" isPro={false} />);

			const addButton = screen.getByRole("button", { name: /add link/i });
			await user.click(addButton);

			expect(alertSpy).toHaveBeenCalledWith("Upgrade to Pro for unlimited links");
			expect(screen.queryByText("Add New Link")).not.toBeInTheDocument();

			alertSpy.mockRestore();
		});

		it("should allow Pro users to add unlimited links", async () => {
			const user = userEvent.setup();

			const tenLinks: Link[] = Array.from({ length: 10 }, (_, i) => ({
				id: `link-${i}`,
				userId: "user-1",
				title: `Link ${i}`,
				url: `https://example${i}.com`,
				icon: null,
				position: i,
				isActive: true,
				clicks: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			render(<LinkList initialLinks={tenLinks} userId="user-1" isPro={true} />);

			const addButton = screen.getByRole("button", { name: /add link/i });
			await user.click(addButton);

			// Should show editor
			expect(screen.getByText("Add New Link")).toBeInTheDocument();
		});
	});

	describe("Edit Link", () => {
		it("should show link editor when Edit is clicked", async () => {
			const user = userEvent.setup();
			render(<LinkList initialLinks={mockLinks} userId="user-1" isPro={false} />);

			const editButton = screen.getAllByRole("button", { name: /edit/i })[0];
			await user.click(editButton);

			expect(screen.getByText("Edit Link")).toBeInTheDocument();
			expect(screen.getByDisplayValue("Link 1")).toBeInTheDocument();
			expect(screen.getByDisplayValue("https://example1.com")).toBeInTheDocument();
		});
	});
});
