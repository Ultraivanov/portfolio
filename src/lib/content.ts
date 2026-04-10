import type { CaseSectionContent } from "@/content/cases";

/**
 * Normalized content structure
 */
export type NormalizedCaseSectionContent =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "link"; label: string; href: string }
  | {
      type: "media";
      src: string;
      alt: string;
      caption?: string;
      variant?: "desktop" | "diagram";
    };

/**
 * Normalize legacy discriminant format to modern type format
 */
export const normalizeBlockContent = (
  block: CaseSectionContent
): NormalizedCaseSectionContent => {
  if ("discriminant" in block) {
    return {
      type: block.discriminant as "paragraph" | "list" | "link" | "media",
      ...block.value,
    } as NormalizedCaseSectionContent;
  }
  return block as NormalizedCaseSectionContent;
};

/**
 * Type guard for paragraph block
 */
export const isParagraphBlock = (
  block: NormalizedCaseSectionContent
): block is { type: "paragraph"; text: string } => {
  return block.type === "paragraph" && "text" in block;
};

/**
 * Type guard for list block
 */
export const isListBlock = (
  block: NormalizedCaseSectionContent
): block is { type: "list"; items: string[] } => {
  return block.type === "list" && "items" in block;
};

/**
 * Type guard for link block
 */
export const isLinkBlock = (
  block: NormalizedCaseSectionContent
): block is { type: "link"; label: string; href: string } => {
  return (
    block.type === "link" &&
    "href" in block &&
    "label" in block
  );
};

/**
 * Type guard for media block
 */
export const isMediaBlock = (
  block: NormalizedCaseSectionContent
): block is {
  type: "media";
  src: string;
  alt: string;
  caption?: string;
  variant?: "desktop" | "diagram";
} => {
  return block.type === "media" && "src" in block && "alt" in block;
};
