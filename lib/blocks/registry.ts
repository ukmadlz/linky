import type { ZodTypeAny } from "zod";
import {
  linkBlockSchema,
  textBlockSchema,
  embedBlockSchema,
  socialIconsBlockSchema,
  dividerBlockSchema,
  customCodeBlockSchema,
  imageBlockSchema,
  emailCollectBlockSchema,
  groupBlockSchema,
  type BlockType,
} from "./schemas";

export interface BlockTypeDefinition {
  type: BlockType;
  label: string;
  icon: string; // Lucide icon name
  description: string;
  dataSchema: ZodTypeAny;
  defaultData: Record<string, unknown>;
}

export const blockRegistry: Record<BlockType, BlockTypeDefinition> = {
  link: {
    type: "link",
    label: "Link",
    icon: "Link",
    description: "A clickable button that links to any URL",
    dataSchema: linkBlockSchema,
    defaultData: {
      url: "",
      title: "My Link",
      verificationEnabled: false,
    },
  },
  text: {
    type: "text",
    label: "Text",
    icon: "Type",
    description: "A heading or paragraph of text",
    dataSchema: textBlockSchema,
    defaultData: {
      content: "Add some text here",
      variant: "paragraph",
      align: "center",
    },
  },
  embed: {
    type: "embed",
    label: "Embed",
    icon: "Play",
    description: "Embed YouTube, Spotify, Vimeo, and more",
    dataSchema: embedBlockSchema,
    defaultData: {
      originalUrl: "",
      providerName: "Unknown",
      embedType: "custom",
    },
  },
  social_icons: {
    type: "social_icons",
    label: "Social Icons",
    icon: "Share2",
    description: "A row of social media icons with links",
    dataSchema: socialIconsBlockSchema,
    defaultData: {
      icons: [{ platform: "instagram", url: "" }],
      size: "md",
      style: "monochrome",
    },
  },
  divider: {
    type: "divider",
    label: "Divider",
    icon: "Minus",
    description: "A visual separator between content",
    dataSchema: dividerBlockSchema,
    defaultData: {
      style: "line",
    },
  },
  custom_code: {
    type: "custom_code",
    label: "Custom Code",
    icon: "Code2",
    description: "Embed custom HTML and CSS",
    dataSchema: customCodeBlockSchema,
    defaultData: {
      html: "",
      css: "",
      sanitized: false,
    },
  },
  image: {
    type: "image",
    label: "Image",
    icon: "Image",
    description: "A standalone image with optional click-through link",
    dataSchema: imageBlockSchema,
    defaultData: {
      url: "",
      alt: "",
      linkUrl: "",
    },
  },
  email_collect: {
    type: "email_collect",
    label: "Email Signup",
    icon: "Mail",
    description: "Embed a newsletter signup form",
    dataSchema: emailCollectBlockSchema,
    defaultData: {
      provider: "custom",
      embedCode: "",
    },
  },
  group: {
    type: "group",
    label: "Group",
    icon: "FolderOpen",
    description: "A collapsible section containing other blocks",
    dataSchema: groupBlockSchema,
    defaultData: {
      title: "Group",
      isCollapsed: false,
    },
  },
};

export function getBlockDef(type: BlockType): BlockTypeDefinition {
  const def = blockRegistry[type];
  if (!def) {
    throw new Error(`Unknown block type: ${type}`);
  }
  return def;
}

export const blockTypes = Object.keys(blockRegistry) as BlockType[];
