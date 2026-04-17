import type { IntakeFocus } from "@/lib/github-case-intake";

export type BlueprintPalette = {
  background: string;
  grid: string;
  ink: string;
  accent: string;
};

export type BlueprintCoverCandidate = {
  mode: "blueprint";
  focus: IntakeFocus;
  title: string;
  subtitle: string;
  alt: string;
  previewUrl: string;
  width: number;
  height: number;
  palette: BlueprintPalette;
};

const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 900;
const TITLE_MAX = 72;
const SUBTITLE_MAX = 140;

const FOCUS_PALETTE: Record<IntakeFocus, BlueprintPalette> = {
  "ux-driven": {
    background: "#06264a",
    grid: "#2f5f8f",
    ink: "#d9ecff",
    accent: "#86d6ff",
  },
  "behavioral-model": {
    background: "#0d2542",
    grid: "#476b8d",
    ink: "#e6f0ff",
    accent: "#9ac3ff",
  },
  "agentic-flow": {
    background: "#07253d",
    grid: "#3e6b8d",
    ink: "#dff6ff",
    accent: "#84f0ff",
  },
};

const FOCUS_LABEL: Record<IntakeFocus, string> = {
  "ux-driven": "UX-driven",
  "behavioral-model": "Behavioral model",
  "agentic-flow": "Agentic flow",
};

export function buildBlueprintCoverCandidate(params: {
  title: string;
  subtitle: string;
  focus: IntakeFocus;
  width?: number;
  height?: number;
}): BlueprintCoverCandidate {
  const focus = normalizeFocus(params.focus);
  const width = normalizeDimension(params.width, DEFAULT_WIDTH, 800, 2400);
  const height = normalizeDimension(params.height, DEFAULT_HEIGHT, 450, 1600);
  const title = sanitizeText(params.title, TITLE_MAX, "Case Study");
  const subtitle = sanitizeText(params.subtitle, SUBTITLE_MAX, "Evidence-backed product case");
  const alt = `${title} blueprint cover (${FOCUS_LABEL[focus]})`;

  const query = new URLSearchParams({
    title,
    subtitle,
    focus,
    width: String(width),
    height: String(height),
  });

  return {
    mode: "blueprint",
    focus,
    title,
    subtitle,
    alt,
    width,
    height,
    palette: FOCUS_PALETTE[focus],
    previewUrl: `/api/cover/blueprint?${query.toString()}`,
  };
}

export function renderBlueprintCoverSvg(params: {
  title: string;
  subtitle: string;
  focus: IntakeFocus;
  width?: number;
  height?: number;
}): string {
  const focus = normalizeFocus(params.focus);
  const width = normalizeDimension(params.width, DEFAULT_WIDTH, 800, 2400);
  const height = normalizeDimension(params.height, DEFAULT_HEIGHT, 450, 1600);
  const title = escapeXml(sanitizeText(params.title, TITLE_MAX, "Case Study"));
  const subtitle = escapeXml(sanitizeText(params.subtitle, SUBTITLE_MAX, "Evidence-backed product case"));
  const focusLabel = escapeXml(FOCUS_LABEL[focus]);
  const palette = FOCUS_PALETTE[focus];

  const titleY = Math.round(height * 0.42);
  const subtitleY = titleY + 74;
  const labelY = subtitleY + 56;
  const safeInset = Math.round(width * 0.08);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" stroke="${palette.grid}" stroke-opacity="0.38" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="${palette.background}"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <path d="M ${safeInset} ${Math.round(height * 0.2)} L ${Math.round(width * 0.9)} ${Math.round(height * 0.2)}" stroke="${palette.accent}" stroke-width="2" stroke-opacity="0.8"/>
  <path d="M ${safeInset} ${Math.round(height * 0.82)} L ${Math.round(width * 0.78)} ${Math.round(height * 0.82)}" stroke="${palette.accent}" stroke-width="2" stroke-opacity="0.55"/>
  <text x="${safeInset}" y="${titleY}" fill="${palette.ink}" font-size="76" font-family="'SF Mono','Menlo','Consolas',monospace" font-weight="700">${title}</text>
  <text x="${safeInset}" y="${subtitleY}" fill="${palette.ink}" fill-opacity="0.92" font-size="32" font-family="'SF Mono','Menlo','Consolas',monospace" font-weight="500">${subtitle}</text>
  <text x="${safeInset}" y="${labelY}" fill="${palette.accent}" font-size="22" font-family="'SF Mono','Menlo','Consolas',monospace" letter-spacing="1.4">${focusLabel}</text>
</svg>`;
}

function normalizeFocus(value: IntakeFocus): IntakeFocus {
  return value === "behavioral-model" || value === "agentic-flow" ? value : "ux-driven";
}

function sanitizeText(value: string, maxLength: number, fallback: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return fallback;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function normalizeDimension(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
