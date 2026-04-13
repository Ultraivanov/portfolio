import {
  validateCaseContentPath,
  validateCaseStudyPayload,
  validateUploadPath,
} from "@/lib/cms/validation";

describe("CMS validation", () => {
  describe("validateCaseContentPath", () => {
    it("accepts allowed case path", () => {
      const result = validateCaseContentPath("src/content/cases/railway-booking-flow.json");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.slug).toBe("railway-booking-flow");
      }
    });

    it("rejects path outside case content", () => {
      const result = validateCaseContentPath("src/content/home.json");
      expect(result.ok).toBe(false);
    });
  });

  describe("validateUploadPath", () => {
    it("accepts allowed image upload path", () => {
      const result = validateUploadPath("public/cases/megamod/screen-01.png");
      expect(result.ok).toBe(true);
    });

    it("rejects disallowed upload extension", () => {
      const result = validateUploadPath("public/cases/megamod/payload.exe");
      expect(result.ok).toBe(false);
    });

    it("rejects traversal-like upload path", () => {
      const result = validateUploadPath("public/cases/megamod/../secret.png");
      expect(result.ok).toBe(false);
    });
  });

  describe("validateCaseStudyPayload", () => {
    const validCase = {
      slug: "test-case",
      title: "Test case",
      subtitle: "Subtitle",
      coverSrc: "/cases/test/cover.png",
      coverAlt: "Cover alt",
      facts: [{ label: "role", value: "Product Designer" }],
      sections: [
        {
          title: "Context",
          blocks: [
            {
              discriminant: "paragraph",
              value: { text: "Body" },
            },
          ],
        },
      ],
    };

    it("accepts valid case payload", () => {
      const result = validateCaseStudyPayload(validCase);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.slug).toBe("test-case");
      }
    });

    it("accepts object slug and normalizes it", () => {
      const result = validateCaseStudyPayload({
        ...validCase,
        slug: { name: "Test", slug: "object-slug" },
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.slug).toBe("object-slug");
      }
    });

    it("rejects fact with empty label", () => {
      const result = validateCaseStudyPayload({
        ...validCase,
        facts: [{ label: " ", value: "x" }],
      });
      expect(result.ok).toBe(false);
    });

    it("rejects invalid block discriminant", () => {
      const result = validateCaseStudyPayload({
        ...validCase,
        sections: [
          {
            title: "Context",
            blocks: [
              {
                discriminant: "unknown",
                value: {},
              },
            ],
          },
        ],
      });
      expect(result.ok).toBe(false);
    });
  });
});
