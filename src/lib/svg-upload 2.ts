import { optimize, type Config } from "svgo";

export const GITHUB_FILE_WARNING_BYTES = 50 * 1024 * 1024; // 50 MiB
export const PLATFORM_MAX_FILE_BYTES = 100 * 1024 * 1024; // GitHub/Vercel hard cap
export const DEFAULT_SVG_TARGET_BYTES = 2 * 1024 * 1024; // CMS budget

const DANGEROUS_SVG_PATTERN =
  /<\s*script\b|<\s*foreignObject\b|\son[a-z]+\s*=|(?:xlink:)?href\s*=\s*["'][^"']*javascript:|<!DOCTYPE|<!ENTITY/i;

export class SvgUploadError extends Error {
  status: number;

  constructor(message: string, status = 422) {
    super(message);
    this.name = "SvgUploadError";
    this.status = status;
  }
}

export interface SvgOptimizationResult {
  content: string;
  originalBytes: number;
  optimizedBytes: number;
  usedAggressivePass: boolean;
}

export function parseByteLimit(
  value: string | undefined,
  fallback: number
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function isSvgUpload(file: File): boolean {
  const name = file.name.toLowerCase();
  return file.type === "image/svg+xml" || name.endsWith(".svg");
}

export function optimizeSvgForUpload(
  svgInput: string,
  targetBytes: number
): SvgOptimizationResult {
  const originalBytes = Buffer.byteLength(svgInput, "utf-8");
  if (originalBytes > PLATFORM_MAX_FILE_BYTES) {
    throw new SvgUploadError(
      `SVG is too large (${formatBytes(originalBytes)}). Max allowed is ${formatBytes(PLATFORM_MAX_FILE_BYTES)}.`,
      413
    );
  }

  assertSafeSvg(svgInput);

  let optimized = runSvgo(svgInput, buildBaseConfig());
  let usedAggressivePass = false;

  if (Buffer.byteLength(optimized, "utf-8") > targetBytes) {
    optimized = runSvgo(optimized, buildAggressiveConfig());
    usedAggressivePass = true;
  }

  assertSafeSvg(optimized);

  const optimizedBytes = Buffer.byteLength(optimized, "utf-8");
  if (optimizedBytes > PLATFORM_MAX_FILE_BYTES) {
    throw new SvgUploadError(
      `Optimized SVG is too large (${formatBytes(optimizedBytes)}). Max allowed is ${formatBytes(PLATFORM_MAX_FILE_BYTES)}.`,
      413
    );
  }

  return {
    content: optimized,
    originalBytes,
    optimizedBytes,
    usedAggressivePass,
  };
}

function assertSafeSvg(svgContent: string): void {
  if (!/<\s*svg\b/i.test(svgContent)) {
    throw new SvgUploadError("Invalid SVG: root <svg> tag is missing.");
  }

  if (DANGEROUS_SVG_PATTERN.test(svgContent)) {
    throw new SvgUploadError(
      "Unsafe SVG detected. Remove scripts, foreignObject, inline handlers, javascript: URLs, and DTD entities."
    );
  }
}

function runSvgo(input: string, config: Config): string {
  const result = optimize(input, config);
  return result.data;
}

function buildBaseConfig(): Config {
  return {
    multipass: true,
    js2svg: { indent: 0, pretty: false },
    plugins: [
      {
        name: "preset-default",
      },
    ],
  };
}

function buildAggressiveConfig(): Config {
  return {
    multipass: true,
    js2svg: { indent: 0, pretty: false },
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            cleanupNumericValues: { floatPrecision: 2 },
            convertPathData: { floatPrecision: 2 },
          },
        },
      },
      "removeDimensions",
      "sortAttrs",
    ],
  };
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
