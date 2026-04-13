import {
  addBlock,
  addFact,
  addSection,
  createUploadPath,
  moveBlock,
  removeBlock,
  removeFact,
  toPublicPath,
  updateBlockValue,
  updateCaseField,
  updateFactField,
  updateSectionField,
  validateCaseForSave,
} from "@/app/admin/lib/case-editor";
import type { CaseStudy } from "@/app/admin/types";

const buildCase = (): CaseStudy => ({
  slug: "demo-case",
  title: "Demo Case",
  subtitle: "Subtitle",
  coverSrc: "/cases/demo/cover.png",
  coverAlt: "Cover alt",
  facts: [{ label: "role", value: "Product Designer" }],
  sections: [
    {
      title: "Context",
      blocks: [
        { discriminant: "paragraph", value: { text: "A" } },
        { discriminant: "paragraph", value: { text: "B" } },
      ],
    },
  ],
});

describe("case-editor", () => {
  it("updates top-level field", () => {
    const updated = updateCaseField(buildCase(), "title", "Updated");
    expect(updated.title).toBe("Updated");
  });

  it("adds and removes facts", () => {
    const withFact = addFact(buildCase());
    expect(withFact.facts).toHaveLength(2);

    const removed = removeFact(withFact, 1);
    expect(removed.facts).toHaveLength(1);
  });

  it("updates fact field", () => {
    const updated = updateFactField(buildCase(), 0, "label", "scope");
    expect(updated.facts[0].label).toBe("scope");
  });

  it("adds and updates sections", () => {
    const withSection = addSection(buildCase());
    expect(withSection.sections).toHaveLength(2);

    const updated = updateSectionField(withSection, 1, "title", "Outcome");
    expect(updated.sections[1].title).toBe("Outcome");
  });

  it("updates, adds, removes and moves blocks", () => {
    const updated = updateBlockValue(buildCase(), 0, 0, { text: "Updated" });
    expect(updated.sections[0].blocks[0].value.text).toBe("Updated");

    const withBlock = addBlock(updated, 0, "media");
    expect(withBlock.sections[0].blocks).toHaveLength(3);

    const moved = moveBlock(withBlock, 0, 0, 1);
    expect(moved.sections[0].blocks[1].value.text).toBe("Updated");

    const removed = removeBlock(moved, 0, 2);
    expect(removed.sections[0].blocks).toHaveLength(2);
  });

  it("does not mutate input when adding or removing blocks", () => {
    const original = buildCase();
    const originalBlockCount = original.sections[0].blocks.length;

    const withBlock = addBlock(original, 0, "list");
    expect(withBlock.sections[0].blocks).toHaveLength(originalBlockCount + 1);
    expect(original.sections[0].blocks).toHaveLength(originalBlockCount);

    const removed = removeBlock(withBlock, 0, 0);
    expect(removed.sections[0].blocks).toHaveLength(originalBlockCount);
    expect(withBlock.sections[0].blocks).toHaveLength(originalBlockCount + 1);
  });

  it("builds upload and public paths", () => {
    const uploadPath = createUploadPath("demo-case", "image.webp", 123456);
    expect(uploadPath).toBe("public/cases/demo-case/123456.webp");
    expect(toPublicPath(uploadPath)).toBe("/cases/demo-case/123456.webp");
  });

  it("validates required case fields", () => {
    expect(validateCaseForSave(buildCase())).toBeNull();

    const invalid = { ...buildCase(), title: "" };
    expect(validateCaseForSave(invalid)).toBe("Title is required");
  });
});
