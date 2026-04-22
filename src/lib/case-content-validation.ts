type ValidationResult = { ok: true } | { ok: false; error: string };

type UnknownRecord = Record<string, unknown>;

export function validateCaseContent(content: unknown): ValidationResult {
  if (!isRecord(content)) {
    return { ok: false, error: "Content must be an object." };
  }

  const requiredStrings: Array<keyof UnknownRecord> = [
    "slug",
    "title",
    "subtitle",
    "coverSrc",
    "coverAlt",
  ];

  for (const key of requiredStrings) {
    if (!isNonEmptyString(content[key])) {
      return { ok: false, error: `Field "${String(key)}" must be a non-empty string.` };
    }
  }

  const facts = content.facts;
  if (!Array.isArray(facts)) {
    return { ok: false, error: 'Field "facts" must be an array.' };
  }

  for (let i = 0; i < facts.length; i += 1) {
    const fact = facts[i];
    if (!isRecord(fact) || !isNonEmptyString(fact.label)) {
      return { ok: false, error: `facts[${i}] must contain a non-empty "label".` };
    }

    const value = fact.value;
    const validValue =
      isNonEmptyString(value) ||
      (Array.isArray(value) && value.every((item) => isNonEmptyString(item)));
    if (!validValue) {
      return {
        ok: false,
        error: `facts[${i}].value must be a non-empty string or array of non-empty strings.`,
      };
    }
  }

  const sections = content.sections;
  if (!Array.isArray(sections) || sections.length === 0) {
    return { ok: false, error: 'Field "sections" must be a non-empty array.' };
  }

  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    if (!isRecord(section) || !isNonEmptyString(section.title)) {
      return { ok: false, error: `sections[${i}] must contain a non-empty "title".` };
    }
    if (!Array.isArray(section.blocks)) {
      return { ok: false, error: `sections[${i}].blocks must be an array.` };
    }

    for (let j = 0; j < section.blocks.length; j += 1) {
      const block = section.blocks[j];
      const blockValidation = validateBlock(block, i, j);
      if (!blockValidation.ok) {
        return blockValidation;
      }
    }
  }

  if (content.seo !== undefined && !isValidSeo(content.seo)) {
    return { ok: false, error: 'Field "seo" must be an object with string values.' };
  }

  return { ok: true };
}

export function validateHomeContent(content: unknown): ValidationResult {
  if (!isRecord(content)) {
    return { ok: false, error: "Content must be an object." };
  }

  const hero = requireRecord(content.hero, "hero");
  if (!hero.ok) return hero;
  const heroStrings = [
    "titleImageSrc",
    "titleImageAlt",
    "headline",
    "ctaLabel",
    "ctaHref",
    "secondaryCtaLabel",
    "secondaryCtaHref",
  ] as const;
  for (const key of heroStrings) {
    if (!isNonEmptyString(hero.value[key])) {
      return { ok: false, error: `hero.${key} must be a non-empty string.` };
    }
  }

  const about = requireRecord(content.about, "about");
  if (!about.ok) return about;
  const aboutStrings = ["name", "role", "avatarSrc", "description"] as const;
  for (const key of aboutStrings) {
    if (!isNonEmptyString(about.value[key])) {
      return { ok: false, error: `about.${key} must be a non-empty string.` };
    }
  }

  const cover = requireRecord(content.cover, "cover");
  if (!cover.ok) return cover;
  if (!isNonEmptyString(cover.value.src) || !isNonEmptyString(cover.value.alt)) {
    return { ok: false, error: "cover.src and cover.alt must be non-empty strings." };
  }

  const skills = requireLabeledGroupSection(content.skills, "skills");
  if (!skills.ok) return skills;
  const tools = requireLabeledGroupSection(content.tools, "tools");
  if (!tools.ok) return tools;

  const resources = requireRecord(content.resources, "resources");
  if (!resources.ok) return resources;
  if (!isNonEmptyString(resources.value.label)) {
    return { ok: false, error: "resources.label must be a non-empty string." };
  }
  if (!Array.isArray(resources.value.items) || resources.value.items.length === 0) {
    return { ok: false, error: "resources.items must be a non-empty array." };
  }
  for (let i = 0; i < resources.value.items.length; i += 1) {
    const item = resources.value.items[i];
    if (!isRecord(item)) {
      return { ok: false, error: `resources.items[${i}] must be an object.` };
    }
    const keys = ["title", "description", "linkLabel", "href"] as const;
    for (const key of keys) {
      if (!isNonEmptyString(item[key])) {
        return { ok: false, error: `resources.items[${i}].${key} must be a non-empty string.` };
      }
    }
  }

  const cta = requireRecord(content.cta, "cta");
  if (!cta.ok) return cta;
  const ctaStrings = ["titleLine1", "titleLine2", "highlight", "description"] as const;
  for (const key of ctaStrings) {
    if (!isNonEmptyString(cta.value[key])) {
      return { ok: false, error: `cta.${key} must be a non-empty string.` };
    }
  }
  if (!Array.isArray(cta.value.links) || cta.value.links.length === 0) {
    return { ok: false, error: "cta.links must be a non-empty array." };
  }
  for (let i = 0; i < cta.value.links.length; i += 1) {
    const link = cta.value.links[i];
    if (!isRecord(link)) {
      return { ok: false, error: `cta.links[${i}] must be an object.` };
    }
    if (!isNonEmptyString(link.label) || !isNonEmptyString(link.href)) {
      return { ok: false, error: `cta.links[${i}].label and .href must be non-empty strings.` };
    }
  }

  return { ok: true };
}

export function validateContactContent(content: unknown): ValidationResult {
  if (!isRecord(content)) {
    return { ok: false, error: "Content must be an object." };
  }

  const keys = [
    "title",
    "subtitle",
    "email",
    "availability",
    "location",
    "note",
  ] as const;

  for (const key of keys) {
    if (!isNonEmptyString(content[key])) {
      return { ok: false, error: `Field "${key}" must be a non-empty string.` };
    }
  }

  return { ok: true };
}

export function validateContentByPath(
  path: string,
  content: unknown
): ValidationResult {
  if (/^src\/content\/cases\/[a-z0-9-]+\.json$/i.test(path)) {
    return validateCaseContent(content);
  }
  if (/^src\/content\/home\.json$/i.test(path)) {
    return validateHomeContent(content);
  }
  if (/^src\/content\/contact\.json$/i.test(path)) {
    return validateContactContent(content);
  }

  return {
    ok: false,
    error:
      "Invalid content path. Allowed paths: src/content/cases/<slug>.json, src/content/home.json, src/content/contact.json",
  };
}

function validateBlock(
  block: unknown,
  sectionIndex: number,
  blockIndex: number
): ValidationResult {
  if (!isRecord(block)) {
    return { ok: false, error: `sections[${sectionIndex}].blocks[${blockIndex}] must be an object.` };
  }

  const discriminant = block.discriminant;
  if (!isNonEmptyString(discriminant)) {
    return {
      ok: false,
      error: `sections[${sectionIndex}].blocks[${blockIndex}].discriminant must be a non-empty string.`,
    };
  }

  if (!isRecord(block.value)) {
    return {
      ok: false,
      error: `sections[${sectionIndex}].blocks[${blockIndex}].value must be an object.`,
    };
  }

  const value = block.value;
  const location = `sections[${sectionIndex}].blocks[${blockIndex}]`;

  switch (discriminant) {
    case "paragraph":
      if (!isNonEmptyString(value.text)) {
        return { ok: false, error: `${location}.value.text must be a non-empty string.` };
      }
      return { ok: true };
    case "list":
      if (!Array.isArray(value.items) || value.items.some((item) => !isNonEmptyString(item))) {
        return {
          ok: false,
          error: `${location}.value.items must be an array of non-empty strings.`,
        };
      }
      return { ok: true };
    case "link":
      if (!isNonEmptyString(value.label) || !isNonEmptyString(value.href)) {
        return {
          ok: false,
          error: `${location}.value.label and .value.href must be non-empty strings.`,
        };
      }
      return { ok: true };
    case "media":
      if (!isNonEmptyString(value.src) || !isNonEmptyString(value.alt)) {
        return {
          ok: false,
          error: `${location}.value.src and .value.alt must be non-empty strings.`,
        };
      }
      if (hasLegacyEmbedSource(value.src)) {
        return {
          ok: false,
          error: `${location}.value.src contains a legacy embed placeholder or embed URL. Use uploaded image path only.`,
        };
      }
      if (value.caption !== undefined && !isNonEmptyString(value.caption)) {
        return { ok: false, error: `${location}.value.caption must be a non-empty string if provided.` };
      }
      {
        const allowedKeys = new Set(["src", "alt", "caption"]);
        const unsupportedKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
        if (unsupportedKeys.length > 0) {
          return {
            ok: false,
            error: `${location}.value contains unsupported key(s): ${unsupportedKeys.join(", ")}.`,
          };
        }
      }
      return { ok: true };
    default:
      return {
        ok: false,
        error: `${location}.discriminant has unsupported value "${discriminant}".`,
      };
  }
}

function isValidSeo(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const keys = ["metaTitle", "metaDescription", "ogImage"] as const;
  return keys.every((key) => value[key] === undefined || isNonEmptyString(value[key]));
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function requireRecord(value: unknown, field: string):
  | { ok: true; value: UnknownRecord }
  | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: `Field "${field}" must be an object.` };
  }
  return { ok: true, value };
}

function requireLabeledGroupSection(
  value: unknown,
  field: string
): ValidationResult {
  const section = requireRecord(value, field);
  if (!section.ok) return section;
  if (!isNonEmptyString(section.value.label)) {
    return { ok: false, error: `${field}.label must be a non-empty string.` };
  }
  if (!Array.isArray(section.value.groups) || section.value.groups.length === 0) {
    return { ok: false, error: `${field}.groups must be a non-empty array.` };
  }
  for (let i = 0; i < section.value.groups.length; i += 1) {
    const group = section.value.groups[i];
    if (!isRecord(group)) {
      return { ok: false, error: `${field}.groups[${i}] must be an object.` };
    }
    if (group.title !== undefined && !isNonEmptyString(group.title)) {
      return { ok: false, error: `${field}.groups[${i}].title must be a non-empty string.` };
    }
    if (!Array.isArray(group.items) || group.items.some((item) => !isNonEmptyString(item))) {
      return {
        ok: false,
        error: `${field}.groups[${i}].items must be an array of non-empty strings.`,
      };
    }
  }

  return { ok: true };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasLegacyEmbedSource(src: unknown): boolean {
  if (!isNonEmptyString(src)) {
    return false;
  }

  const normalized = src.trim().toLowerCase();
  if (normalized.includes("figma_embed_")) {
    return true;
  }

  if (normalized.includes("<iframe") || normalized.includes("</iframe>")) {
    return true;
  }

  return (
    normalized.includes("figma.com/embed") ||
    normalized.includes("youtube.com/embed") ||
    normalized.includes("player.vimeo.com/video")
  );
}
