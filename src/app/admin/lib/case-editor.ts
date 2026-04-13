import type { Block, CaseStudy, Fact, SeoData, Section } from "../types";

export const defaultBlockValue: Record<Block["discriminant"], Block["value"]> = {
  paragraph: { text: "" },
  list: { items: [""] },
  link: { label: "", href: "" },
  media: { src: "", alt: "", caption: "", variant: "diagram" },
};

export const updateCaseField = <K extends keyof CaseStudy>(
  data: CaseStudy,
  field: K,
  value: CaseStudy[K],
): CaseStudy => ({ ...data, [field]: value });

export const updateFactField = (
  data: CaseStudy,
  index: number,
  field: keyof Fact,
  value: string | string[],
): CaseStudy => {
  const facts = [...data.facts];
  facts[index] = { ...facts[index], [field]: value };
  return updateCaseField(data, "facts", facts);
};

export const addFact = (data: CaseStudy): CaseStudy =>
  updateCaseField(data, "facts", [...data.facts, { label: "", value: "" }]);

export const removeFact = (data: CaseStudy, index: number): CaseStudy =>
  updateCaseField(
    data,
    "facts",
    data.facts.filter((_, i) => i !== index),
  );

export const updateSeoField = (
  data: CaseStudy,
  field: keyof SeoData,
  value: string,
): CaseStudy => updateCaseField(data, "seo", { ...(data.seo || {}), [field]: value });

export const updateSectionField = (
  data: CaseStudy,
  sectionIndex: number,
  field: keyof Section,
  value: string,
): CaseStudy => {
  const sections = [...data.sections];
  sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
  return updateCaseField(data, "sections", sections);
};

export const addSection = (data: CaseStudy): CaseStudy =>
  updateCaseField(data, "sections", [
    ...data.sections,
    { title: "", blocks: [{ discriminant: "paragraph", value: { text: "" } }] },
  ]);

export const removeSection = (data: CaseStudy, index: number): CaseStudy =>
  updateCaseField(
    data,
    "sections",
    data.sections.filter((_, i) => i !== index),
  );

export const updateBlockValue = (
  data: CaseStudy,
  sectionIndex: number,
  blockIndex: number,
  value: Partial<Block["value"]>,
): CaseStudy => {
  const sections = [...data.sections];
  const blocks = [...sections[sectionIndex].blocks];
  blocks[blockIndex] = {
    ...blocks[blockIndex],
    value: { ...blocks[blockIndex].value, ...value },
  };
  sections[sectionIndex] = { ...sections[sectionIndex], blocks };
  return updateCaseField(data, "sections", sections);
};

export const addBlock = (
  data: CaseStudy,
  sectionIndex: number,
  type: Block["discriminant"],
): CaseStudy => {
  const sections = [...data.sections];
  const blocks = [...sections[sectionIndex].blocks, { discriminant: type, value: defaultBlockValue[type] }];
  sections[sectionIndex] = { ...sections[sectionIndex], blocks };
  return updateCaseField(data, "sections", sections);
};

export const removeBlock = (
  data: CaseStudy,
  sectionIndex: number,
  blockIndex: number,
): CaseStudy => {
  const sections = [...data.sections];
  const blocks = sections[sectionIndex].blocks.filter((_, i) => i !== blockIndex);
  sections[sectionIndex] = { ...sections[sectionIndex], blocks };
  return updateCaseField(data, "sections", sections);
};

export const moveBlock = (
  data: CaseStudy,
  sectionIndex: number,
  fromIndex: number,
  toIndex: number,
): CaseStudy => {
  if (fromIndex === toIndex) return data;

  const sections = [...data.sections];
  const blocks = [...sections[sectionIndex].blocks];
  const [moved] = blocks.splice(fromIndex, 1);
  blocks.splice(toIndex, 0, moved);
  sections[sectionIndex] = { ...sections[sectionIndex], blocks };
  return updateCaseField(data, "sections", sections);
};

export const createUploadPath = (
  slug: string,
  fileName: string,
  now = Date.now(),
) => {
  const ext = fileName.split(".").pop() || "png";
  return `public/cases/${slug}/${now}.${ext}`;
};

export const toPublicPath = (path: string) => path.replace(/^public/, "");

export const validateCaseForSave = (data: CaseStudy): string | null => {
  if (!data.title.trim()) return "Title is required";
  if (!data.slug.trim()) return "Slug is required";
  if (!data.coverAlt.trim()) return "Cover alt text is required";

  const emptyFact = data.facts.find((fact) => !fact.label.trim());
  if (emptyFact) return "All fact labels must be filled";

  const emptySection = data.sections.find((section) => !section.title.trim());
  if (emptySection) return "All section titles must be filled";

  return null;
};
