import {
  applyImportedArtifactsToDraft,
  normalizeExtractorCommands,
  type ImportedArtifact,
} from "@/lib/github-case-extractor";
import type { CaseDraft } from "@/lib/github-case-intake";

describe("normalizeExtractorCommands", () => {
  it("keeps only valid import_runtime_screenshot commands", () => {
    const commands = normalizeExtractorCommands([
      {
        type: "import_runtime_screenshot",
        route: "/work",
        pageUrl: "https://example.com/work",
        screenshotUrl: "https://img.example.com/work.png",
        reason: "Primary flow",
      },
      {
        type: "import_runtime_screenshot",
        route: "",
        pageUrl: "https://example.com",
        screenshotUrl: "https://img.example.com/a.png",
      },
      {
        type: "import_runtime_screenshot",
        route: "/bad",
        pageUrl: "javascript:alert(1)",
        screenshotUrl: "https://img.example.com/b.png",
      },
      {
        type: "unsupported",
        route: "/ignored",
        pageUrl: "https://example.com",
        screenshotUrl: "https://img.example.com/c.png",
      },
    ]);

    expect(commands).toEqual([
      {
        type: "import_runtime_screenshot",
        route: "/work",
        pageUrl: "https://example.com/work",
        screenshotUrl: "https://img.example.com/work.png",
        reason: "Primary flow",
      },
    ]);
  });
});

describe("applyImportedArtifactsToDraft", () => {
  it("updates existing visual artifact blocks by runtime route", () => {
    const draft: CaseDraft = {
      slug: "demo",
      title: "Demo",
      subtitle: "Case",
      coverSrc: "/cases/demo/cover.png",
      coverAlt: "Demo cover",
      facts: [],
      sections: [
        {
          title: "Visual Artifacts",
          blocks: [
            {
              discriminant: "media",
              value: {
                src: "https://img.example.com/old.png",
                alt: "Demo runtime screenshot /work",
                caption: "old",
              },
            },
          ],
        },
      ],
    };

    const imported: ImportedArtifact[] = [
      {
        type: "import_runtime_screenshot",
        route: "/work",
        pageUrl: "https://example.com/work",
        src: "/cases/demo/runtime-1.png",
        bytes: 128,
        reason: "Core UX flow",
      },
    ];

    const updated = applyImportedArtifactsToDraft(draft, imported);
    const mediaBlock = updated.sections[0].blocks[0];

    expect(mediaBlock.discriminant).toBe("media");
    if (mediaBlock.discriminant !== "media") {
      throw new Error("Expected media block");
    }

    expect(mediaBlock.value.src).toBe("/cases/demo/runtime-1.png");
    expect(mediaBlock.value.caption).toBe("Core UX flow");
  });

  it("creates Visual Artifacts section when missing", () => {
    const draft: CaseDraft = {
      slug: "demo",
      title: "Demo",
      subtitle: "Case",
      coverSrc: "/cases/demo/cover.png",
      coverAlt: "Demo cover",
      facts: [],
      sections: [
        {
          title: "Context",
          blocks: [{ discriminant: "paragraph", value: { text: "text" } }],
        },
      ],
    };

    const imported: ImportedArtifact[] = [
      {
        type: "import_runtime_screenshot",
        route: "/",
        pageUrl: "https://example.com/",
        src: "/cases/demo/runtime-home.png",
        bytes: 256,
      },
    ];

    const updated = applyImportedArtifactsToDraft(draft, imported);
    const visualArtifacts = updated.sections.find((section) => section.title === "Visual Artifacts");

    expect(visualArtifacts).toBeDefined();
    expect(visualArtifacts?.blocks).toHaveLength(2);
    expect(visualArtifacts?.blocks[0]).toEqual({
      discriminant: "media",
      value: {
        src: "/cases/demo/runtime-home.png",
        alt: "Demo runtime screenshot /",
        caption: "Runtime screenshot / (imported)",
      },
    });
    expect(visualArtifacts?.blocks[1]).toEqual({
      discriminant: "link",
      value: {
        label: "Open route /",
        href: "https://example.com/",
      },
    });
  });
});
