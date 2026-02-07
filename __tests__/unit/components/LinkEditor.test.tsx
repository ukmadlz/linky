import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LinkEditor from "@/components/dashboard/LinkEditor";
import type { Link } from "@/lib/db/schema";

describe("LinkEditor", () => {
	const mockOnSave = vi.fn();
	const mockOnCancel = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should render in create mode when link is null", () => {
			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			expect(screen.getByText("Add New Link")).toBeInTheDocument();
			expect(screen.getByLabelText(/title/i)).toHaveValue("");
			expect(screen.getByLabelText(/url/i)).toHaveValue("");
		});

		it("should render in edit mode with existing link data", () => {
			const existingLink: Link = {
				id: "link-1",
				userId: "user-1",
				title: "My Website",
				url: "https://example.com",
				icon: "🔗",
				position: 0,
				isActive: true,
				clicks: 10,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			render(<LinkEditor link={existingLink} onSave={mockOnSave} onCancel={mockOnCancel} />);

			expect(screen.getByText("Edit Link")).toBeInTheDocument();
			expect(screen.getByLabelText(/title/i)).toHaveValue("My Website");
			expect(screen.getByLabelText(/url/i)).toHaveValue("https://example.com");
		});

		it("should render all icon options", () => {
			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const iconButtons = screen.getAllByRole("button", { name: /🔗|📱|💼/i });
			expect(iconButtons.length).toBeGreaterThan(0);
		});
	});

	describe("Form Validation", () => {
		it("should show error when title is empty", async () => {
			const user = userEvent.setup();
			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const urlInput = screen.getByLabelText(/url/i);
			await user.type(urlInput, "https://example.com");

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("Title is required")).toBeInTheDocument();
			});

			expect(mockOnSave).not.toHaveBeenCalled();
		});

		it("should show error when URL is empty", async () => {
			const user = userEvent.setup();
			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const titleInput = screen.getByLabelText(/title/i);
			await user.type(titleInput, "My Link");

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("URL is required")).toBeInTheDocument();
			});

			expect(mockOnSave).not.toHaveBeenCalled();
		});

		it("should show error when URL is invalid", async () => {
			const user = userEvent.setup();
			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const titleInput = screen.getByLabelText(/title/i);
			const urlInput = screen.getByLabelText(/url/i);

			await user.type(titleInput, "My Link");
			await user.type(urlInput, "not-a-valid-url");

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("Invalid URL")).toBeInTheDocument();
			});

			expect(mockOnSave).not.toHaveBeenCalled();
		});

		it("should add https:// prefix if URL has no protocol", async () => {
			const user = userEvent.setup();
			mockOnSave.mockResolvedValue(undefined);

			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const titleInput = screen.getByLabelText(/title/i);
			const urlInput = screen.getByLabelText(/url/i);

			await user.type(titleInput, "Example Site");
			await user.type(urlInput, "example.com");

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith({
					title: "Example Site",
					url: "https://example.com",
					icon: null,
				});
			});
		});
	});

	describe("Form Submission", () => {
		it("should call onSave with form data on successful submission", async () => {
			const user = userEvent.setup();
			mockOnSave.mockResolvedValue(undefined);

			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const titleInput = screen.getByLabelText(/title/i);
			const urlInput = screen.getByLabelText(/url/i);

			await user.type(titleInput, "My New Link");
			await user.type(urlInput, "https://example.com");

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith({
					title: "My New Link",
					url: "https://example.com",
					icon: null,
				});
			});
		});

		it("should include selected icon in submission", async () => {
			const user = userEvent.setup();
			mockOnSave.mockResolvedValue(undefined);

			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const titleInput = screen.getByLabelText(/title/i);
			const urlInput = screen.getByLabelText(/url/i);

			await user.type(titleInput, "My Link");
			await user.type(urlInput, "https://example.com");

			// Click an icon button
			const iconButton = screen.getByRole("button", { name: "🔗" });
			await user.click(iconButton);

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith({
					title: "My Link",
					url: "https://example.com",
					icon: "🔗",
				});
			});
		});

		it("should trim whitespace from title and URL", async () => {
			const user = userEvent.setup();
			mockOnSave.mockResolvedValue(undefined);

			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const titleInput = screen.getByLabelText(/title/i);
			const urlInput = screen.getByLabelText(/url/i);

			await user.type(titleInput, "  My Link  ");
			await user.type(urlInput, "  https://example.com  ");

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith({
					title: "My Link",
					url: "https://example.com",
					icon: null,
				});
			});
		});

		it("should show error message when onSave rejects", async () => {
			const user = userEvent.setup();
			mockOnSave.mockRejectedValue(new Error("Save failed"));

			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const titleInput = screen.getByLabelText(/title/i);
			const urlInput = screen.getByLabelText(/url/i);

			await user.type(titleInput, "My Link");
			await user.type(urlInput, "https://example.com");

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("Failed to save link")).toBeInTheDocument();
			});
		});

		it("should disable buttons while saving", async () => {
			const user = userEvent.setup();
			mockOnSave.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const titleInput = screen.getByLabelText(/title/i);
			const urlInput = screen.getByLabelText(/url/i);

			await user.type(titleInput, "My Link");
			await user.type(urlInput, "https://example.com");

			const submitButton = screen.getByRole("button", { name: /save/i });
			await user.click(submitButton);

			// Buttons should be disabled while saving
			expect(submitButton).toBeDisabled();
			expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

			// Wait for save to complete
			await waitFor(() => {
				expect(submitButton).not.toBeDisabled();
			});
		});
	});

	describe("Cancel Functionality", () => {
		it("should call onCancel when cancel button is clicked", async () => {
			const user = userEvent.setup();
			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			const cancelButton = screen.getByRole("button", { name: /cancel/i });
			await user.click(cancelButton);

			expect(mockOnCancel).toHaveBeenCalledOnce();
			expect(mockOnSave).not.toHaveBeenCalled();
		});
	});

	describe("Icon Selection", () => {
		it("should allow selecting and deselecting icons", async () => {
			const user = userEvent.setup();
			render(<LinkEditor link={null} onSave={mockOnSave} onCancel={mockOnCancel} />);

			// Select an icon
			const iconButton = screen.getByRole("button", { name: "🔗" });
			await user.click(iconButton);

			// Icon should be selected (has blue border)
			expect(iconButton).toHaveClass("border-blue-500");

			// Click the "no icon" button
			const noIconButton = screen.getByRole("button", { name: "—" });
			await user.click(noIconButton);

			// No icon should be selected
			expect(noIconButton).toHaveClass("border-blue-500");
			expect(iconButton).not.toHaveClass("border-blue-500");
		});
	});
});
