import {
  SvgUploadError,
  optimizeSvgForUpload,
  parseByteLimit,
} from "@/lib/svg-upload";

describe("svg-upload utility", () => {
  it("optimizes a safe svg and keeps viewBox", () => {
    const input = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10">
        <path d="M0 0 L10 0 L10 10 Z"></path>
      </svg>
    `;

    const result = optimizeSvgForUpload(input, 1024 * 1024);

    expect(result.content).toContain("<svg");
    expect(result.content).toContain("viewBox");
    expect(result.optimizedBytes).toBeLessThanOrEqual(result.originalBytes);
  });

  it("rejects unsafe svg markup", () => {
    const unsafe = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`;

    expect(() => optimizeSvgForUpload(unsafe, 1024 * 1024)).toThrow(SvgUploadError);
  });

  it("parses byte limits with fallback", () => {
    expect(parseByteLimit(undefined, 123)).toBe(123);
    expect(parseByteLimit("2048", 123)).toBe(2048);
    expect(parseByteLimit("0", 123)).toBe(123);
    expect(parseByteLimit("not-a-number", 123)).toBe(123);
  });
});
