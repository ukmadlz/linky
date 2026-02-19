import { describe, it, expect } from "vitest";
import {
  linkBlockSchema,
  textBlockSchema,
  embedBlockSchema,
  socialIconsBlockSchema,
  dividerBlockSchema,
  customCodeBlockSchema,
} from "@/lib/blocks/schemas";

// ─── linkBlockSchema ──────────────────────────────────────────

describe("linkBlockSchema", () => {
  it("accepts a valid URL and title", () => {
    const result = linkBlockSchema.safeParse({
      url: "https://example.com",
      title: "Example",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when url is missing", () => {
    const result = linkBlockSchema.safeParse({ title: "Example" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid URL", () => {
    const result = linkBlockSchema.safeParse({
      url: "not-a-url",
      title: "Example",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional thumbnailUrl to be absent", () => {
    const result = linkBlockSchema.safeParse({
      url: "https://example.com",
      title: "Example",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.thumbnailUrl).toBeUndefined();
  });

  it("allows optional icon to be absent", () => {
    const result = linkBlockSchema.safeParse({
      url: "https://example.com",
      title: "Example",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.icon).toBeUndefined();
  });

  it("accepts verification fields when present", () => {
    const result = linkBlockSchema.safeParse({
      url: "https://example.com",
      title: "Adult content",
      verificationEnabled: true,
      verificationMode: "age",
    });
    expect(result.success).toBe(true);
  });
});

// ─── textBlockSchema ──────────────────────────────────────────

describe("textBlockSchema", () => {
  it("accepts valid heading with center align", () => {
    const result = textBlockSchema.safeParse({
      content: "Hello world",
      variant: "heading",
      align: "center",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid paragraph with left align", () => {
    const result = textBlockSchema.safeParse({
      content: "Some text",
      variant: "paragraph",
      align: "left",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid variant enum", () => {
    const result = textBlockSchema.safeParse({
      content: "Text",
      variant: "subtitle",
      align: "center",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid align enum", () => {
    const result = textBlockSchema.safeParse({
      content: "Text",
      variant: "paragraph",
      align: "justify",
    });
    expect(result.success).toBe(false);
  });
});

// ─── embedBlockSchema ─────────────────────────────────────────

describe("embedBlockSchema", () => {
  it("accepts a valid oembed embed", () => {
    const result = embedBlockSchema.safeParse({
      originalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      providerName: "YouTube",
      embedType: "oembed",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid iframe embed", () => {
    const result = embedBlockSchema.safeParse({
      originalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      providerName: "YouTube",
      embedType: "iframe",
      iframeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      aspectRatio: "16/9",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when originalUrl is missing", () => {
    const result = embedBlockSchema.safeParse({
      providerName: "YouTube",
      embedType: "iframe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown embedType", () => {
    const result = embedBlockSchema.safeParse({
      originalUrl: "https://example.com",
      providerName: "Example",
      embedType: "video",
    });
    expect(result.success).toBe(false);
  });
});

// ─── socialIconsBlockSchema ───────────────────────────────────

describe("socialIconsBlockSchema", () => {
  it("accepts a valid icons array", () => {
    const result = socialIconsBlockSchema.safeParse({
      icons: [{ platform: "twitter", url: "https://twitter.com/user" }],
      size: "md",
      style: "filled",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty icons array", () => {
    const result = socialIconsBlockSchema.safeParse({
      icons: [],
      size: "md",
      style: "filled",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an icon with an invalid URL", () => {
    const result = socialIconsBlockSchema.safeParse({
      icons: [{ platform: "twitter", url: "not-a-url" }],
      size: "md",
      style: "filled",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid size enum", () => {
    const result = socialIconsBlockSchema.safeParse({
      icons: [{ platform: "twitter", url: "https://twitter.com/user" }],
      size: "xl",
      style: "filled",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid style enum", () => {
    const result = socialIconsBlockSchema.safeParse({
      icons: [{ platform: "twitter", url: "https://twitter.com/user" }],
      size: "md",
      style: "gradient",
    });
    expect(result.success).toBe(false);
  });
});

// ─── dividerBlockSchema ───────────────────────────────────────

describe("dividerBlockSchema", () => {
  it("accepts line style", () => {
    expect(dividerBlockSchema.safeParse({ style: "line" }).success).toBe(true);
  });

  it("accepts space style", () => {
    expect(dividerBlockSchema.safeParse({ style: "space" }).success).toBe(true);
  });

  it("accepts dots style", () => {
    expect(dividerBlockSchema.safeParse({ style: "dots" }).success).toBe(true);
  });

  it("rejects unknown style", () => {
    expect(dividerBlockSchema.safeParse({ style: "wave" }).success).toBe(false);
  });

  it("uses line as default when style is omitted", () => {
    const result = dividerBlockSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.style).toBe("line");
  });
});

// ─── customCodeBlockSchema ────────────────────────────────────

describe("customCodeBlockSchema", () => {
  it("accepts html with optional css", () => {
    const result = customCodeBlockSchema.safeParse({
      html: "<div>Hello</div>",
      css: "div { color: red; }",
      sanitized: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts html without css", () => {
    const result = customCodeBlockSchema.safeParse({
      html: "<p>Hello</p>",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.css).toBeUndefined();
  });

  it("rejects when html is missing", () => {
    const result = customCodeBlockSchema.safeParse({ css: "p { color: red; }" });
    expect(result.success).toBe(false);
  });
});
