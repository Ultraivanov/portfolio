const CASE_PATH_PATTERN = /^src\/content\/cases\/([a-z0-9-]+)\.json$/;
const UPLOAD_PATH_PATTERN = /^public\/cases\/([a-z0-9-]+)\/([A-Za-z0-9._-]+)$/;
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "gif",
  "avif",
]);

type ValidationSuccess<T> = { ok: true; data: T };
type ValidationFailure = { ok: false; error: string; details?: Record<string, unknown> };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type FactPayload = {
  label: string;
  value: string | string[];
  href?: string;
};

export type CaseBlockPayload = {
  discriminant: "paragraph" | "list" | "link" | "media";
  value: {
    text?: string;
    items?: string[];
    label?: string;
    href?: string;
    src?: string;
    alt?: string;
    caption?: string;
    variant?: "phone" | "desktop" | "diagram";
  };
};

export type CaseSectionPayload = {
  title: string;
  blocks: CaseBlockPayload[];
};

export type CaseStudyPayload = {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
  facts: FactPayload[];
  sections: CaseSectionPayload[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isNonEmptyString = (value: unknown): value is string =>
  isString(value) && value.trim().length > 0;

const validateFact = (value: unknown, index: number): ValidationResult<FactPayload> => {
  if (!isRecord(value)) {
    return { ok: false, error: "Invalid fact object", details: { index } };
  }

  if (!isNonEmptyString(value.label)) {
    return {
      ok: false,
      error: "Fact label is required",
      details: { index, field: "label" },
    };
  }

  const factValue = value.value;
  const valueIsValid =
    isString(factValue) ||
    (Array.isArray(factValue) && factValue.every((item) => isString(item)));

  if (!valueIsValid) {
    return {
      ok: false,
      error: "Fact value must be string or string[]",
      details: { index, field: "value" },
    };
  }

  if (value.href !== undefined && !isString(value.href)) {
    return {
      ok: false,
      error: "Fact href must be a string",
      details: { index, field: "href" },
    };
  }

  return {
    ok: true,
    data: {
      label: value.label,
      value: factValue,
      href: value.href as string | undefined,
    },
  };
};

const validateBlock = (value: unknown, sectionIndex: number, blockIndex: number): ValidationResult<CaseBlockPayload> => {
  if (!isRecord(value) || !isRecord(value.value)) {
    return {
      ok: false,
      error: "Invalid block object",
      details: { sectionIndex, blockIndex },
    };
  }

  const discriminant = value.discriminant;
  if (
    discriminant !== "paragraph" &&
    discriminant !== "list" &&
    discriminant !== "link" &&
    discriminant !== "media"
  ) {
    return {
      ok: false,
      error: "Block discriminant is invalid",
      details: { sectionIndex, blockIndex, discriminant },
    };
  }

  const blockValue = value.value;

  if (discriminant === "paragraph" && blockValue.text !== undefined && !isString(blockValue.text)) {
    return {
      ok: false,
      error: "Paragraph block text must be string",
      details: { sectionIndex, blockIndex, field: "value.text" },
    };
  }

  if (discriminant === "list") {
    const items = blockValue.items;
    if (items !== undefined && (!Array.isArray(items) || !items.every((item) => isString(item)))) {
      return {
        ok: false,
        error: "List block items must be string[]",
        details: { sectionIndex, blockIndex, field: "value.items" },
      };
    }
  }

  if (discriminant === "link") {
    if (blockValue.label !== undefined && !isString(blockValue.label)) {
      return {
        ok: false,
        error: "Link block label must be string",
        details: { sectionIndex, blockIndex, field: "value.label" },
      };
    }
    if (blockValue.href !== undefined && !isString(blockValue.href)) {
      return {
        ok: false,
        error: "Link block href must be string",
        details: { sectionIndex, blockIndex, field: "value.href" },
      };
    }
  }

  if (discriminant === "media") {
    if (blockValue.src !== undefined && !isString(blockValue.src)) {
      return {
        ok: false,
        error: "Media block src must be string",
        details: { sectionIndex, blockIndex, field: "value.src" },
      };
    }
    if (blockValue.alt !== undefined && !isString(blockValue.alt)) {
      return {
        ok: false,
        error: "Media block alt must be string",
        details: { sectionIndex, blockIndex, field: "value.alt" },
      };
    }
    if (blockValue.caption !== undefined && !isString(blockValue.caption)) {
      return {
        ok: false,
        error: "Media block caption must be string",
        details: { sectionIndex, blockIndex, field: "value.caption" },
      };
    }
    if (
      blockValue.variant !== undefined &&
      blockValue.variant !== "phone" &&
      blockValue.variant !== "desktop" &&
      blockValue.variant !== "diagram"
    ) {
      return {
        ok: false,
        error: "Media block variant is invalid",
        details: { sectionIndex, blockIndex, field: "value.variant" },
      };
    }
  }

  return {
    ok: true,
    data: {
      discriminant,
      value: {
        text: blockValue.text as string | undefined,
        items: blockValue.items as string[] | undefined,
        label: blockValue.label as string | undefined,
        href: blockValue.href as string | undefined,
        src: blockValue.src as string | undefined,
        alt: blockValue.alt as string | undefined,
        caption: blockValue.caption as string | undefined,
        variant: blockValue.variant as "phone" | "desktop" | "diagram" | undefined,
      },
    },
  };
};

const validateSections = (value: unknown): ValidationResult<CaseSectionPayload[]> => {
  if (!Array.isArray(value)) {
    return { ok: false, error: "Sections must be an array", details: { field: "sections" } };
  }

  const sections: CaseSectionPayload[] = [];
  for (let sectionIndex = 0; sectionIndex < value.length; sectionIndex += 1) {
    const section = value[sectionIndex];
    if (!isRecord(section)) {
      return { ok: false, error: "Section must be an object", details: { sectionIndex } };
    }

    if (!isNonEmptyString(section.title)) {
      return {
        ok: false,
        error: "Section title is required",
        details: { sectionIndex, field: "title" },
      };
    }

    if (!Array.isArray(section.blocks)) {
      return {
        ok: false,
        error: "Section blocks must be an array",
        details: { sectionIndex, field: "blocks" },
      };
    }

    const blocks: CaseBlockPayload[] = [];
    for (let blockIndex = 0; blockIndex < section.blocks.length; blockIndex += 1) {
      const blockValidation = validateBlock(section.blocks[blockIndex], sectionIndex, blockIndex);
      if (!blockValidation.ok) return blockValidation;
      blocks.push(blockValidation.data);
    }

    sections.push({ title: section.title, blocks });
  }

  return { ok: true, data: sections };
};

const normalizeSlug = (slug: unknown): string | null => {
  if (isString(slug)) return slug;
  if (isRecord(slug) && isString(slug.slug)) return slug.slug;
  return null;
};

export const validateCaseStudyPayload = (value: unknown): ValidationResult<CaseStudyPayload> => {
  if (!isRecord(value)) {
    return { ok: false, error: "Case payload must be an object" };
  }

  const slug = normalizeSlug(value.slug);
  if (!isNonEmptyString(slug)) {
    return { ok: false, error: "Case slug is required", details: { field: "slug" } };
  }

  if (!isNonEmptyString(value.title)) {
    return { ok: false, error: "Case title is required", details: { field: "title" } };
  }

  if (!isString(value.subtitle)) {
    return { ok: false, error: "Case subtitle must be a string", details: { field: "subtitle" } };
  }

  if (!isString(value.coverSrc)) {
    return { ok: false, error: "Case coverSrc must be a string", details: { field: "coverSrc" } };
  }

  if (!isNonEmptyString(value.coverAlt)) {
    return { ok: false, error: "Case coverAlt is required", details: { field: "coverAlt" } };
  }

  if (!Array.isArray(value.facts)) {
    return { ok: false, error: "Case facts must be an array", details: { field: "facts" } };
  }
  const facts: FactPayload[] = [];
  for (let index = 0; index < value.facts.length; index += 1) {
    const factValidation = validateFact(value.facts[index], index);
    if (!factValidation.ok) return factValidation;
    facts.push(factValidation.data);
  }

  const sectionsValidation = validateSections(value.sections);
  if (!sectionsValidation.ok) return sectionsValidation;

  const seoValue = value.seo;
  if (seoValue !== undefined) {
    if (!isRecord(seoValue)) {
      return { ok: false, error: "SEO must be an object", details: { field: "seo" } };
    }
    if (seoValue.metaTitle !== undefined && !isString(seoValue.metaTitle)) {
      return { ok: false, error: "SEO metaTitle must be a string", details: { field: "seo.metaTitle" } };
    }
    if (seoValue.metaDescription !== undefined && !isString(seoValue.metaDescription)) {
      return {
        ok: false,
        error: "SEO metaDescription must be a string",
        details: { field: "seo.metaDescription" },
      };
    }
    if (seoValue.ogImage !== undefined && !isString(seoValue.ogImage)) {
      return { ok: false, error: "SEO ogImage must be a string", details: { field: "seo.ogImage" } };
    }
  }

  return {
    ok: true,
    data: {
      slug,
      title: value.title,
      subtitle: value.subtitle,
      coverSrc: value.coverSrc,
      coverAlt: value.coverAlt,
      facts,
      sections: sectionsValidation.data,
      seo: seoValue as CaseStudyPayload["seo"],
    },
  };
};

export const validateCaseContentPath = (path: unknown): ValidationResult<{ path: string; slug: string }> => {
  if (!isString(path)) {
    return { ok: false, error: "Path must be a string", details: { field: "path" } };
  }

  const match = CASE_PATH_PATTERN.exec(path);
  if (!match) {
    return {
      ok: false,
      error: "Path is not allowed",
      details: { field: "path", expected: "src/content/cases/<slug>.json" },
    };
  }

  return { ok: true, data: { path, slug: match[1] } };
};

export const validateUploadPath = (path: unknown): ValidationResult<{ path: string; slug: string; filename: string }> => {
  if (!isString(path)) {
    return { ok: false, error: "Path must be a string", details: { field: "path" } };
  }

  const match = UPLOAD_PATH_PATTERN.exec(path);
  if (!match) {
    return {
      ok: false,
      error: "Upload path is not allowed",
      details: { field: "path", expected: "public/cases/<slug>/<filename>" },
    };
  }

  const [, slug, filename] = match;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: "Image extension is not allowed",
      details: { filename, allowed: Array.from(ALLOWED_IMAGE_EXTENSIONS) },
    };
  }

  return { ok: true, data: { path, slug, filename } };
};
