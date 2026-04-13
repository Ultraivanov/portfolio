import Typograf from "typograf";

const tp = new Typograf({ locale: ["ru", "en-US"] });

/** Typograf a single string */
export function typografText(text: string): string {
  if (!text.trim()) return text;
  return tp.execute(text);
}

/** Typograf all text content in a case study object (mutates nothing, returns a new object) */
export function typografCase<
  T extends {
    title?: string;
    subtitle?: string;
    facts?: Array<{ label: string; value: string | string[] }>;
    sections?: Array<{
      title: string;
      blocks: Array<{
        discriminant: string;
        value: Record<string, unknown>;
      }>;
    }>;
  },
>(data: T): T {
  return {
    ...data,
    title: data.title ? typografText(data.title) : data.title,
    subtitle: data.subtitle ? typografText(data.subtitle) : data.subtitle,
    facts: data.facts?.map((fact) => ({
      ...fact,
      label: typografText(fact.label),
      value: Array.isArray(fact.value)
        ? fact.value.map(typografText)
        : typografText(fact.value),
    })),
    sections: data.sections?.map((section) => ({
      ...section,
      title: typografText(section.title),
      blocks: section.blocks.map((block) => {
        if (block.discriminant === "paragraph" && typeof block.value.text === "string") {
          return { ...block, value: { ...block.value, text: typografText(block.value.text as string) } };
        }
        if (block.discriminant === "list" && Array.isArray(block.value.items)) {
          return {
            ...block,
            value: { ...block.value, items: (block.value.items as string[]).map(typografText) },
          };
        }
        if (block.discriminant === "link" && typeof block.value.label === "string") {
          return { ...block, value: { ...block.value, label: typografText(block.value.label as string) } };
        }
        return block;
      }),
    })),
  };
}
