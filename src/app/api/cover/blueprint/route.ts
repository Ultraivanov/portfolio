import { apiError } from "@/lib/api-response";
import { renderBlueprintCoverSvg } from "@/lib/blueprint-cover-candidate";
import type { IntakeFocus } from "@/lib/github-case-intake";

const ALLOWED_FOCUS: ReadonlySet<IntakeFocus> = new Set([
  "ux-driven",
  "behavioral-model",
  "agentic-flow",
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = (searchParams.get("title") || "").trim();
    const subtitle = (searchParams.get("subtitle") || "").trim();
    const focus = normalizeFocus(searchParams.get("focus"));
    const width = normalizeDimension(searchParams.get("width"));
    const height = normalizeDimension(searchParams.get("height"));

    const svg = renderBlueprintCoverSvg({
      title,
      subtitle,
      focus,
      width,
      height,
    });

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return apiError(
      500,
      "BLUEPRINT_COVER_FAILED",
      error instanceof Error ? error.message : "Failed to render blueprint cover"
    );
  }
}

function normalizeFocus(value: string | null): IntakeFocus {
  if (value && ALLOWED_FOCUS.has(value as IntakeFocus)) {
    return value as IntakeFocus;
  }
  return "ux-driven";
}

function normalizeDimension(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}
