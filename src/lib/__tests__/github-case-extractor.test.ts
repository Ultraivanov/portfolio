import {
  applyImportedArtifactsToDraft,
  type ImportedArtifact,
} from "@/lib/github-case-extractor";
import type { CaseDraft } from "@/lib/github-case-intake";

function createDraft(): CaseDraft {
  return {
    slug: "demo-case",
    title: "Demo Case",
    subtitle: "Demo subtitle",
    coverSrc: "/cases/demo/cover.png",
    coverAlt: "Demo cover",
    facts: [{ label: "role", value: "Designer" }],
    sections: [
      {
        title: "Context",
        blocks: [{ discriminant: "paragraph", value: { text: "Context text" } }],
      },
      {
        title: "Visual Artifacts",
        blocks: [
          {
            discriminant: "media",
            value: {
              src: "/cases/demo/original-checkout-details.png",
              alt: "Demo Case runtime screenshot /checkout/details",
              caption: "Old caption",
            },
          },
        ],
      },
    ],
  };
}

describe("applyImportedArtifactsToDraft", () => {
  it("deduplicates repeated route imports (last import wins) and appends deterministically", () => {
    const draft = createDraft();
    const imported: ImportedArtifact[] = [
      {
        type: "import_runtime_screenshot",
        route: "/z-route",
        pageUrl: "https://example.com/z-route",
        src: "/cases/demo/runtime-z-old.png",
        bytes: 1200,
      },
      {
        type: "import_runtime_screenshot",
        route: "/a-route",
        pageUrl: "https://example.com/a-route",
        src: "/cases/demo/runtime-a.png",
        bytes: 1300,
      },
      {
        type: "import_runtime_screenshot",
        route: "/z-route",
        pageUrl: "https://example.com/z-route",
        src: "/cases/demo/runtime-z-new.png",
        bytes: 1400,
      },
    ];

    const updated = applyImportedArtifactsToDraft(draft, imported);
    const visual = updated.sections.find((section) => section.title === "Visual Artifacts");
    expect(visual).toBeDefined();

    const mediaBlocks = visual?.blocks.filter((block) => block.discriminant === "media") || [];
    const linkBlocks = visual?.blocks.filter((block) => block.discriminant === "link") || [];

    const zRouteMedia = mediaBlocks.filter(
      (block) =>
        block.discriminant === "media" &&
        block.value.alt?.toLowerCase().includes("runtime screenshot /z-route")
    );
    expect(zRouteMedia).toHaveLength(1);
    expect(zRouteMedia[0].discriminant).toBe("media");
    if (zRouteMedia[0].discriminant === "media") {
      expect(zRouteMedia[0].value.src).toBe("/cases/demo/runtime-z-new.png");
    }

    const runtimeRouteMedia = mediaBlocks
      .filter((block) => block.discriminant === "media")
      .map((block) => (block.discriminant === "media" ? block.value.alt || "" : ""));
    const appendedRouteOrder = runtimeRouteMedia.filter((alt) =>
      alt.toLowerCase().includes("runtime screenshot /")
    );
    expect(appendedRouteOrder[1]).toContain("/a-route");
    expect(appendedRouteOrder[2]).toContain("/z-route");
    expect(linkBlocks.length).toBeGreaterThanOrEqual(2);
  });

  it("does not treat /checkout as existing when only /checkout/details exists", () => {
    const draft = createDraft();
    const imported: ImportedArtifact[] = [
      {
        type: "import_runtime_screenshot",
        route: "/checkout",
        pageUrl: "https://example.com/checkout",
        src: "/cases/demo/runtime-checkout.png",
        bytes: 1100,
      },
    ];

    const updated = applyImportedArtifactsToDraft(draft, imported);
    const visual = updated.sections.find((section) => section.title === "Visual Artifacts");
    const mediaBlocks = visual?.blocks.filter((block) => block.discriminant === "media") || [];
    const checkoutMedia = mediaBlocks.filter(
      (block) =>
        block.discriminant === "media" &&
        (block.value.alt || "").toLowerCase().includes("runtime screenshot /checkout")
    );

    expect(checkoutMedia).toHaveLength(2);
    const hasDetailsMedia = checkoutMedia.some(
      (block) =>
        block.discriminant === "media" &&
        (block.value.alt || "").toLowerCase().includes("/checkout/details")
    );
    const hasCheckoutMedia = checkoutMedia.some(
      (block) =>
        block.discriminant === "media" &&
        (block.value.alt || "").toLowerCase().includes("runtime screenshot /checkout")
    );
    expect(hasDetailsMedia).toBe(true);
    expect(hasCheckoutMedia).toBe(true);
  });
});
