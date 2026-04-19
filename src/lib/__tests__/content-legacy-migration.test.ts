import fs from "node:fs";
import path from "node:path";

type Violation = {
  file: string;
  path: string;
  message: string;
};

describe("content legacy migration guard", () => {
  it("contains no legacy embed/variant placeholders in content JSON", () => {
    const contentRoot = path.join(process.cwd(), "src", "content");
    const files = listJsonFiles(contentRoot);

    expect(files.some((file) => file.endsWith(path.join("src", "content", "home.json")))).toBe(
      true
    );

    const violations: Violation[] = [];

    for (const file of files) {
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      collectViolations(parsed, file, "$", violations);
    }

    expect(violations).toEqual([]);
  });
});

function listJsonFiles(rootDir: string): string[] {
  const result: string[] = [];

  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".json")) {
        result.push(fullPath);
      }
    }
  }

  return result.sort();
}

function collectViolations(
  value: unknown,
  file: string,
  currentPath: string,
  violations: Violation[]
): void {
  if (typeof value === "string") {
    if (value.toUpperCase().includes("FIGMA_EMBED_")) {
      violations.push({
        file,
        path: currentPath,
        message: "contains FIGMA_EMBED placeholder",
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectViolations(item, file, `${currentPath}[${index}]`, violations);
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [key, fieldValue] of Object.entries(record)) {
    const fieldPath = `${currentPath}.${key}`;

    if (
      key === "discriminant" &&
      typeof fieldValue === "string" &&
      ["embed", "iframe"].includes(fieldValue.trim().toLowerCase())
    ) {
      violations.push({
        file,
        path: fieldPath,
        message: `contains unsupported discriminant \"${fieldValue}\"`,
      });
    }

    if (
      key === "variant" &&
      typeof fieldValue === "string" &&
      ["diagram", "phone", "desktop"].includes(fieldValue.trim().toLowerCase())
    ) {
      violations.push({
        file,
        path: fieldPath,
        message: `contains legacy media variant \"${fieldValue}\"`,
      });
    }

    if (key === "src" && isLegacyEmbedSource(fieldValue)) {
      violations.push({
        file,
        path: fieldPath,
        message: `contains legacy embed source \"${String(fieldValue)}\"`,
      });
    }

    collectViolations(fieldValue, file, fieldPath, violations);
  }
}

function isLegacyEmbedSource(src: unknown): boolean {
  if (typeof src !== "string" || src.trim().length === 0) {
    return false;
  }

  const normalized = src.trim().toLowerCase();
  if (normalized.includes("figma_embed_")) {
    return true;
  }

  if (normalized.includes("<iframe") || normalized.includes("</iframe>")) {
    return true;
  }

  return (
    normalized.includes("figma.com/embed") ||
    normalized.includes("youtube.com/embed") ||
    normalized.includes("player.vimeo.com/video")
  );
}
