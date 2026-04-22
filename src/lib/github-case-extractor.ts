import type { CaseBlock, CaseDraft } from "@/lib/github-case-intake";
import { fetchGitHubWithRetry } from "@/lib/github-api";

export type ExtractorCommand = {
  type: "import_runtime_screenshot";
  route: string;
  pageUrl: string;
  screenshotUrl: string;
  reason?: string;
};

export type ImportedArtifact = {
  type: "import_runtime_screenshot";
  route: string;
  pageUrl: string;
  src: string;
  bytes: number;
  reason?: string;
};

export type FailedArtifact = {
  type: "import_runtime_screenshot";
  route: string;
  pageUrl: string;
  screenshotUrl: string;
  reason?: string;
  error: string;
};

export type ExtractionResult = {
  imported: ImportedArtifact[];
  failed: FailedArtifact[];
};

const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024; // 8 MiB per screenshot
const FETCH_TIMEOUT_MS = 20_000;

export async function executeExtractorCommands(params: {
  slug: string;
  commands: ExtractorCommand[];
  githubToken: string;
  githubRepo: string;
  githubBranch: string;
}): Promise<ExtractionResult> {
  const imported: ImportedArtifact[] = [];
  const failed: FailedArtifact[] = [];

  for (let i = 0; i < params.commands.length; i += 1) {
    const command = params.commands[i];
    if (command.type !== "import_runtime_screenshot") {
      continue;
    }

    try {
      const buffer = await fetchImageBuffer(command.screenshotUrl);
      if (buffer.byteLength > MAX_SCREENSHOT_BYTES) {
        throw new Error(
          `Screenshot is too large (${buffer.byteLength} bytes). Max ${MAX_SCREENSHOT_BYTES} bytes.`
        );
      }

      const filePath = `public/cases/${params.slug}/runtime-${Date.now()}-${i + 1}.png`;
      const base64Content = buffer.toString("base64");

      const updateResponse = await fetchGitHubWithRetry(
        `https://api.github.com/repos/${params.githubRepo}/contents/${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${params.githubToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Extractor import runtime screenshot ${params.slug} ${command.route}`,
            content: base64Content,
            branch: params.githubBranch,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(
          (await safeReadGitHubMessage(updateResponse)) ||
            `GitHub upload failed with ${updateResponse.status}`
        );
      }

      imported.push({
        type: "import_runtime_screenshot",
        route: command.route,
        pageUrl: command.pageUrl,
        src: filePath.replace(/^public/, ""),
        bytes: buffer.byteLength,
        ...(command.reason ? { reason: command.reason } : {}),
      });
    } catch (error) {
      failed.push({
        type: "import_runtime_screenshot",
        route: command.route,
        pageUrl: command.pageUrl,
        screenshotUrl: command.screenshotUrl,
        ...(command.reason ? { reason: command.reason } : {}),
        error: error instanceof Error ? error.message : "Unknown extractor error",
      });
    }
  }

  return { imported, failed };
}

export function normalizeExtractorCommands(value: unknown): ExtractorCommand[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const commands: ExtractorCommand[] = [];
  for (const row of value) {
    const record = asRecord(row);
    if (!record) continue;

    const type = pickNonEmpty(record.type);
    if (type !== "import_runtime_screenshot") continue;

    const route = pickNonEmpty(record.route);
    const pageUrl = pickNonEmpty(record.pageUrl);
    const screenshotUrl = pickNonEmpty(record.screenshotUrl);
    const reason = pickNonEmpty(record.reason) || undefined;

    if (!route || !pageUrl || !screenshotUrl) continue;
    if (!isHttpUrl(pageUrl) || !isHttpUrl(screenshotUrl)) continue;

    commands.push({
      type: "import_runtime_screenshot",
      route,
      pageUrl,
      screenshotUrl,
      ...(reason ? { reason } : {}),
    });
  }

  return commands.slice(0, 12);
}

export function applyImportedArtifactsToDraft(
  draft: CaseDraft,
  imported: ImportedArtifact[]
): CaseDraft {
  if (imported.length === 0) {
    return draft;
  }

  const dedupedImported = dedupeImportedArtifactsByRoute(imported);
  const importedByRoute = new Map(
    dedupedImported.map((row) => [normalizeRouteKey(row.route), row] as const)
  );
  const nextSections = draft.sections.map((section) => {
    if (section.title !== "Visual Artifacts") {
      return section;
    }

    const blocks = section.blocks.map((block) => {
      if (block.discriminant !== "media") {
        return block;
      }

      const route = extractRouteFromAlt(block.value.alt);
      if (!route) return block;

      const importedRow = importedByRoute.get(normalizeRouteKey(route));
      if (!importedRow) return block;

      return {
        ...block,
        value: {
          ...block.value,
          src: importedRow.src,
          caption: importedRow.reason || `Runtime screenshot ${route} (imported)`,
        },
      } as CaseBlock;
    });

    return {
      ...section,
      blocks,
    };
  });

  const missingMediaBlocks: CaseBlock[] = dedupedImported
    .filter((row) => !hasMediaForRoute(nextSections, row.route))
    .sort((a, b) => normalizeRouteKey(a.route).localeCompare(normalizeRouteKey(b.route)))
    .flatMap((row) => [
      {
        discriminant: "media",
        value: {
          src: row.src,
          alt: `${draft.title} runtime screenshot ${row.route}`,
          caption: row.reason || `Runtime screenshot ${row.route} (imported)`,
        },
      } satisfies CaseBlock,
      {
        discriminant: "link",
        value: {
          label: `Open route ${row.route}`,
          href: row.pageUrl,
        },
      } satisfies CaseBlock,
    ]);

  if (missingMediaBlocks.length === 0) {
    return {
      ...draft,
      sections: nextSections,
    };
  }

  const sectionIndex = nextSections.findIndex((section) => section.title === "Visual Artifacts");
  if (sectionIndex >= 0) {
    const sectionsWithAppended = [...nextSections];
    sectionsWithAppended[sectionIndex] = {
      ...sectionsWithAppended[sectionIndex],
      blocks: [...sectionsWithAppended[sectionIndex].blocks, ...missingMediaBlocks],
    };
    return {
      ...draft,
      sections: sectionsWithAppended,
    };
  }

  return {
    ...draft,
    sections: [
      ...nextSections,
      {
        title: "Visual Artifacts",
        blocks: missingMediaBlocks,
      },
    ],
  };
}

function hasMediaForRoute(sections: CaseDraft["sections"], route: string): boolean {
  const targetKey = normalizeRouteKey(route);
  return sections.some(
    (section) =>
      section.title === "Visual Artifacts" &&
      section.blocks.some(
        (block) =>
          block.discriminant === "media" &&
          normalizeRouteKey(extractRouteFromAlt(block.value.alt) || "") === targetKey
      )
  );
}

function dedupeImportedArtifactsByRoute(imported: ImportedArtifact[]): ImportedArtifact[] {
  const deduped = new Map<string, ImportedArtifact>();
  for (const row of imported) {
    deduped.set(normalizeRouteKey(row.route), row);
  }
  return [...deduped.values()];
}

function extractRouteFromAlt(alt: string | undefined): string | null {
  if (typeof alt !== "string") return null;
  const routeMatch = alt.match(/runtime screenshot\s+(.+)$/i);
  return routeMatch?.[1]?.trim() || null;
}

function normalizeRouteKey(route: string): string {
  const trimmed = route.trim();
  if (!trimmed) return "";
  const withSingleSlashes = trimmed.replace(/\/{2,}/g, "/");
  const normalizedPrefix = withSingleSlashes.startsWith("/")
    ? withSingleSlashes
    : `/${withSingleSlashes}`;
  return normalizedPrefix.replace(/\/+$/g, "").toLowerCase();
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      throw new Error(`Screenshot fetch failed with HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected content type: ${contentType || "unknown"}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

async function safeReadGitHubMessage(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message;
  } catch {
    return undefined;
  }
}

function pickNonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
