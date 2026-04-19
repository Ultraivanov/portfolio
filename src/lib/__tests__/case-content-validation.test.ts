import {
  validateCaseContent,
  validateContactContent,
  validateContentByPath,
  validateHomeContent,
} from "@/lib/case-content-validation";

describe("content validation contract", () => {
  it("validates a case document", () => {
    const result = validateCaseContent({
      slug: "test-case",
      title: "Case title",
      subtitle: "Case subtitle",
      coverSrc: "/cases/test/cover.png",
      coverAlt: "Cover",
      facts: [{ label: "role", value: "Designer" }],
      sections: [
        {
          title: "Context",
          blocks: [
            {
              discriminant: "paragraph",
              value: { text: "Some context" },
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it("validates a home document", () => {
    const result = validateHomeContent({
      hero: {
        titleImageSrc: "/home/title.svg",
        titleImageAlt: "Title",
        headline: "Headline",
        ctaLabel: "Contact",
        ctaHref: "/contact",
        secondaryCtaLabel: "CV",
        secondaryCtaHref: "/cv",
      },
      about: {
        name: "Dima",
        role: "Designer",
        avatarSrc: "/home/avatar.png",
        description: "Bio",
      },
      cover: { src: "/home/cover.png", alt: "Cover" },
      skills: { label: "/ skills", groups: [{ title: "A", items: ["B"] }] },
      tools: { label: "/ tools", groups: [{ title: "A", items: ["B"] }] },
      resources: {
        label: "/ resources",
        items: [
          {
            title: "Resource",
            description: "Desc",
            linkLabel: "Open",
            href: "https://example.com",
          },
        ],
      },
      cta: {
        titleLine1: "Let us",
        titleLine2: "build",
        highlight: "together",
        description: "Desc",
        links: [{ label: "CV", href: "/cv" }],
      },
    });

    expect(result.ok).toBe(true);
  });

  it("validates contact document", () => {
    const result = validateContactContent({
      title: "Get in touch",
      subtitle: "Write me",
      email: "d@example.com",
      availability: "Available",
      location: "Tel Aviv",
      note: "Include context",
    });

    expect(result.ok).toBe(true);
  });

  it("routes validation by path", () => {
    const badPath = validateContentByPath("src/content/unknown.json", {});
    expect(badPath.ok).toBe(false);
    if (!badPath.ok) {
      expect(badPath.error).toMatch(/Allowed paths/i);
    }
  });

  it("rejects legacy media fields such as variant", () => {
    const result = validateCaseContent({
      slug: "test-case",
      title: "Case title",
      subtitle: "Case subtitle",
      coverSrc: "/cases/test/cover.png",
      coverAlt: "Cover",
      facts: [{ label: "role", value: "Designer" }],
      sections: [
        {
          title: "Context",
          blocks: [
            {
              discriminant: "media",
              value: {
                src: "/cases/test/diagram.svg",
                alt: "Diagram",
                variant: "diagram",
              },
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unsupported key/i);
      expect(result.error).toMatch(/variant/i);
    }
  });

  it("rejects legacy FIGMA_EMBED placeholder in media src", () => {
    const result = validateCaseContent({
      slug: "test-case",
      title: "Case title",
      subtitle: "Case subtitle",
      coverSrc: "/cases/test/cover.png",
      coverAlt: "Cover",
      facts: [{ label: "role", value: "Designer" }],
      sections: [
        {
          title: "Context",
          blocks: [
            {
              discriminant: "media",
              value: {
                src: "FIGMA_EMBED_CASE_01",
                alt: "Legacy embed",
              },
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/legacy embed placeholder/i);
    }
  });

  it("rejects iframe/embed URLs in media src", () => {
    const result = validateCaseContent({
      slug: "test-case",
      title: "Case title",
      subtitle: "Case subtitle",
      coverSrc: "/cases/test/cover.png",
      coverAlt: "Cover",
      facts: [{ label: "role", value: "Designer" }],
      sections: [
        {
          title: "Context",
          blocks: [
            {
              discriminant: "media",
              value: {
                src: "https://www.figma.com/embed?embed_host=share&url=https://figma.com/file/abc",
                alt: "Legacy embed url",
              },
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/legacy embed placeholder/i);
    }
  });
});
