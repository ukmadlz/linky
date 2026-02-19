import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Link Block
// ─────────────────────────────────────────────────────────────

export const linkBlockSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(1, "Title is required").max(200),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  icon: z.string().optional(),
  verificationEnabled: z.boolean().default(false),
  verificationMode: z.enum(["age", "acknowledge"]).optional(),
});

export type LinkBlockData = z.infer<typeof linkBlockSchema>;

// ─────────────────────────────────────────────────────────────
// Text Block
// ─────────────────────────────────────────────────────────────

export const textBlockSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000),
  variant: z.enum(["heading", "paragraph"]),
  align: z.enum(["left", "center", "right"]).default("center"),
});

export type TextBlockData = z.infer<typeof textBlockSchema>;

// ─────────────────────────────────────────────────────────────
// Embed Block
// ─────────────────────────────────────────────────────────────

export const embedBlockSchema = z.object({
  originalUrl: z.string().url("Must be a valid URL"),
  providerName: z.string(),
  embedType: z.enum(["oembed", "iframe", "custom"]),
  oembedData: z.record(z.unknown()).optional(),
  embedHtml: z.string().optional(),
  iframeUrl: z.string().url().optional().or(z.literal("")),
  aspectRatio: z.string().optional(), // e.g. "16/9", "1/1"
});

export type EmbedBlockData = z.infer<typeof embedBlockSchema>;

// ─────────────────────────────────────────────────────────────
// Social Icons Block
// ─────────────────────────────────────────────────────────────

export const socialIconSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url("Must be a valid URL"),
});

export const socialIconsBlockSchema = z.object({
  icons: z.array(socialIconSchema).min(1, "At least one icon is required"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  style: z.enum(["filled", "outline", "monochrome"]).default("monochrome"),
});

export type SocialIconsBlockData = z.infer<typeof socialIconsBlockSchema>;

// ─────────────────────────────────────────────────────────────
// Divider Block
// ─────────────────────────────────────────────────────────────

export const dividerBlockSchema = z.object({
  style: z.enum(["line", "space", "dots"]).default("line"),
});

export type DividerBlockData = z.infer<typeof dividerBlockSchema>;

// ─────────────────────────────────────────────────────────────
// Custom Code Block
// ─────────────────────────────────────────────────────────────

export const customCodeBlockSchema = z.object({
  html: z.string(),
  css: z.string().optional(),
  sanitized: z.boolean().default(false),
});

export type CustomCodeBlockData = z.infer<typeof customCodeBlockSchema>;

// ─────────────────────────────────────────────────────────────
// Block type union
// ─────────────────────────────────────────────────────────────

export type BlockType =
  | "link"
  | "text"
  | "embed"
  | "social_icons"
  | "divider"
  | "custom_code";

export const blockDataSchemas: Record<BlockType, z.ZodTypeAny> = {
  link: linkBlockSchema,
  text: textBlockSchema,
  embed: embedBlockSchema,
  social_icons: socialIconsBlockSchema,
  divider: dividerBlockSchema,
  custom_code: customCodeBlockSchema,
};

export type BlockData =
  | { type: "link"; data: LinkBlockData }
  | { type: "text"; data: TextBlockData }
  | { type: "embed"; data: EmbedBlockData }
  | { type: "social_icons"; data: SocialIconsBlockData }
  | { type: "divider"; data: DividerBlockData }
  | { type: "custom_code"; data: CustomCodeBlockData };

/**
 * Validate block data against the correct schema for its type.
 * Returns parsed data or throws a ZodError.
 */
export function validateBlockData(
  type: BlockType,
  data: unknown
): Record<string, unknown> {
  const schema = blockDataSchemas[type];
  return schema.parse(data) as Record<string, unknown>;
}
