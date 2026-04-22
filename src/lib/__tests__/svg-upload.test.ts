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

  it("rejects foreignObject and inline handlers", () => {
    const unsafe = `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div onload="x()">x</div></foreignObject></svg>`;

    expect(() => optimizeSvgForUpload(unsafe, 1024 * 1024)).toThrow(SvgUploadError);
  });

  it("rejects data-uri href overload payloads", () => {
    const unsafe = `<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,AAAA"/></svg>`;

    expect(() => optimizeSvgForUpload(unsafe, 1024 * 1024)).toThrow(SvgUploadError);
  });

  it("rejects broken encoding control characters", () => {
    const broken = `<svg xmlns="http://www.w3.org/2000/svg">\u0000<path d="M0 0 L1 1"/></svg>`;

    expect(() => optimizeSvgForUpload(broken, 1024 * 1024)).toThrow(SvgUploadError);
  });

  it("rejects overly complex svg with huge path node count", () => {
    const paths = Array.from({ length: 2001 }, (_, index) => `<path d="M${index} 0 L${index} 1"/>`).join("");
    const complex = `<svg xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;

    expect(() => optimizeSvgForUpload(complex, 1024 * 1024)).toThrow(SvgUploadError);
  });

  it("parses byte limits with fallback", () => {
    expect(parseByteLimit(undefined, 123)).toBe(123);
    expect(parseByteLimit("2048", 123)).toBe(2048);
    expect(parseByteLimit("0", 123)).toBe(123);
    expect(parseByteLimit("not-a-number", 123)).toBe(123);
  });
});
