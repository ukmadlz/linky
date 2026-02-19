import { describe, expect, it } from "vitest";
import {
	sanitizeCustomHtml,
	sanitizeEmbedHtml,
	scopeCustomCss,
} from "@/lib/embeds/sanitize";

describe("sanitizeEmbedHtml", () => {
	it("keeps an <iframe> with an allowlisted src", () => {
		const html = `<iframe src="https://www.youtube-nocookie.com/embed/abc123" width="560" height="315"></iframe>`;
		const result = sanitizeEmbedHtml(html);
		expect(result).toContain("youtube-nocookie.com");
	});

	it("strips an <iframe> whose src is not allowlisted", () => {
		const html = `<iframe src="https://malicious.example.com/evil" width="100" height="100"></iframe>`;
		const result = sanitizeEmbedHtml(html);
		expect(result).not.toContain("malicious.example.com");
	});

	it("handles multiple iframes and keeps only allowlisted ones", () => {
		const html = `
      <iframe src="https://player.vimeo.com/video/123"></iframe>
      <iframe src="https://evil.com/frame"></iframe>
    `;
		const result = sanitizeEmbedHtml(html);
		expect(result).toContain("player.vimeo.com");
		expect(result).not.toContain("evil.com");
	});
});

describe("sanitizeCustomHtml", () => {
	it("keeps allowed tags like <p>, <a>, <strong>", () => {
		const html = `<p>Hello <strong>world</strong>, <a href="https://example.com">link</a></p>`;
		const result = sanitizeCustomHtml(html);
		expect(result).toContain("<p>");
		expect(result).toContain("<strong>");
		expect(result).toContain("<a ");
	});

	it("strips <script> tags and their content", () => {
		const html = `<p>Safe</p><script>alert('xss')</script>`;
		const result = sanitizeCustomHtml(html);
		expect(result).not.toContain("<script>");
		expect(result).not.toContain("alert");
		expect(result).toContain("<p>Safe</p>");
	});

	it("strips onclick and other on* event handlers", () => {
		const html = `<button onclick="alert(1)">Click me</button>`;
		const result = sanitizeCustomHtml(html);
		expect(result).not.toContain("onclick");
	});

	it("removes javascript: href values", () => {
		const html = `<a href="javascript:alert(1)">bad link</a>`;
		const result = sanitizeCustomHtml(html);
		expect(result).not.toContain("javascript:");
	});
});

describe("scopeCustomCss", () => {
	it("prefixes all selectors with the container ID", () => {
		const css = `p { color: red; } .title { font-size: 2rem; }`;
		const result = scopeCustomCss(css, "block-abc123");
		expect(result).toContain("#block-abc123 p");
		expect(result).toContain("#block-abc123 .title");
	});

	it("handles comma-separated selectors", () => {
		const css = `h1, h2 { font-weight: bold; }`;
		const result = scopeCustomCss(css, "block-xyz");
		expect(result).toContain("#block-xyz h1");
		expect(result).toContain("#block-xyz h2");
	});

	it("removes @import statements", () => {
		const css = `@import url('https://fonts.googleapis.com/...'); p { color: blue; }`;
		const result = scopeCustomCss(css, "block-abc");
		expect(result).not.toContain("@import");
	});
});
