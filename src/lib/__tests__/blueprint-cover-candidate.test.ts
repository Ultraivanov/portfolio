import {
  buildBlueprintCoverCandidate,
  renderBlueprintCoverSvg,
} from "@/lib/blueprint-cover-candidate";

describe("buildBlueprintCoverCandidate", () => {
  it("builds deterministic preview payload from title, subtitle and focus", () => {
    const first = buildBlueprintCoverCandidate({
      title: "Agent Workbench",
      subtitle: "Structured UX case",
      focus: "agentic-flow",
    });
    const second = buildBlueprintCoverCandidate({
      title: "Agent Workbench",
      subtitle: "Structured UX case",
      focus: "agentic-flow",
    });

    expect(first).toEqual(second);
    expect(first.previewUrl).toContain("/api/cover/blueprint?");
    expect(first.previewUrl).toContain("focus=agentic-flow");
    expect(first.alt).toContain("blueprint cover");
  });

  it("normalizes long input text and preserves safe defaults", () => {
    const candidate = buildBlueprintCoverCandidate({
      title: "x".repeat(120),
      subtitle: "",
      focus: "ux-driven",
      width: 99999,
      height: -10,
    });

    expect(candidate.title.length).toBeLessThanOrEqual(72);
    expect(candidate.subtitle.length).toBeGreaterThan(0);
    expect(candidate.width).toBe(2400);
    expect(candidate.height).toBe(450);
  });
});

describe("renderBlueprintCoverSvg", () => {
  it("renders svg and escapes xml-sensitive characters", () => {
    const svg = renderBlueprintCoverSvg({
      title: "A <script>alert(1)</script>",
      subtitle: "B & C",
      focus: "behavioral-model",
      width: 1600,
      height: 900,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(svg).toContain("B &amp; C");
    expect(svg).toContain("Behavioral model");
  });
});
