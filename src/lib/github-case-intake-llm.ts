import type {
  CaseBlock,
  CaseDraft,
  GitHubSignals,
  IntakeFocus,
} from "@/lib/github-case-intake";

type OpenAiChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export type LlmDraftResult = {
  draft: CaseDraft;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export async function synthesizeCaseDraftWithLlm(params: {
  signals: GitHubSignals;
  focus: IntakeFocus;
  fallbackDraft: CaseDraft;
  repoUrl: string;
  apiKey: string;
  model?: string;
}): Promise<LlmDraftResult> {
  const model = params.model || process.env.GITHUB_INTAKE_LLM_MODEL || "gpt-4.1-mini";
  const requestPayload = buildPromptPayload(params);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify(requestPayload),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await readOpenAiError(response, "LLM synthesis request failed"));
  }

  const payload = (await response.json()) as OpenAiChatCompletionsResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM response did not contain message content.");
  }

  const parsed = safeParseJson(content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Failed to parse LLM JSON output.");
  }

  const draft = normalizeLlmDraft(parsed, params.fallbackDraft, params.signals, params.repoUrl);

  return {
    draft,
    model,
    usage: payload.usage
      ? {
          promptTokens: payload.usage.prompt_tokens ?? 0,
          completionTokens: payload.usage.completion_tokens ?? 0,
          totalTokens: payload.usage.total_tokens ?? 0,
        }
      : undefined,
  };
}

function buildPromptPayload(params: {
  signals: GitHubSignals;
  focus: IntakeFocus;
  fallbackDraft: CaseDraft;
  repoUrl: string;
}) {
  const { signals, focus, fallbackDraft, repoUrl } = params;
  return {
    task: "Generate an evidence-grounded case-study draft from repository artifacts.",
    constraints: {
      focus,
      requiredSections: [
        "Context",
        "Problem",
        "Constraints",
        "Role",
        "Approach",
        "Solution",
        "Outcome",
      ],
      doNotInventMetricsWithoutEvidence: true,
      format: "Return JSON object with a single key `draft` matching CaseDraft schema.",
    },
    repo: {
      url: repoUrl,
      fullName: signals.repo.full_name,
      description: signals.repo.description,
      language: signals.repo.language,
      stars: signals.repo.stargazers_count,
      forks: signals.repo.forks_count,
      openIssues: signals.repo.open_issues_count,
    },
    readmeExcerpt: truncate(signals.readme, 12000),
    mergedPulls: signals.mergedPulls.slice(0, 12).map((pr) => ({
      title: pr.title,
      body: truncate(pr.body || "", 800),
      url: pr.html_url,
    })),
    closedIssues: signals.closedIssues.slice(0, 12).map((issue) => ({
      title: issue.title,
      body: truncate(issue.body || "", 800),
      url: issue.html_url,
    })),
    routeCandidates: signals.routeCandidates.slice(0, 12),
    runtimeScreenshots: signals.runtimeScreenshots.slice(0, 8),
    fallbackDraft,
  };
}

function normalizeLlmDraft(
  raw: unknown,
  fallbackDraft: CaseDraft,
  signals: GitHubSignals,
  repoUrl: string
): CaseDraft {
  const record = asRecord(raw);
  const rawDraft = asRecord(record?.draft);

  const title = pickNonEmpty(rawDraft?.title) || fallbackDraft.title;
  const subtitle = pickNonEmpty(rawDraft?.subtitle) || fallbackDraft.subtitle;
  const coverSrc = pickNonEmpty(rawDraft?.coverSrc) || fallbackDraft.coverSrc;
  const coverAlt = pickNonEmpty(rawDraft?.coverAlt) || fallbackDraft.coverAlt;

  const facts = normalizeFacts(rawDraft?.facts, fallbackDraft.facts);
  const sections = normalizeSections(rawDraft?.sections, fallbackDraft.sections);

  return {
    slug: fallbackDraft.slug,
    title,
    subtitle,
    coverSrc,
    coverAlt,
    facts:
      facts.length > 0
        ? facts
        : [
            ...fallbackDraft.facts,
            { label: "repository", value: signals.repo.full_name, href: repoUrl },
          ],
    sections: sections.length > 0 ? sections : fallbackDraft.sections,
    seo: {
      metaTitle: pickNonEmpty(asRecord(rawDraft?.seo)?.metaTitle) || `${title} | Case Study`,
      metaDescription: pickNonEmpty(asRecord(rawDraft?.seo)?.metaDescription) || subtitle,
      ogImage: pickNonEmpty(asRecord(rawDraft?.seo)?.ogImage) || fallbackDraft.seo?.ogImage,
    },
  };
}

function normalizeFacts(
  value: unknown,
  fallback: CaseDraft["facts"]
): CaseDraft["facts"] {
  if (!Array.isArray(value)) return fallback;

  const facts: CaseDraft["facts"] = [];
  for (const item of value) {
    const record = asRecord(item);
    const label = pickNonEmpty(record?.label);
    if (!label) continue;

    const href = pickNonEmpty(record?.href);
    const rawValue = record?.value;
    if (typeof rawValue === "string") {
      const text = rawValue.trim();
      if (!text) continue;
      facts.push({ label, value: text, ...(href ? { href } : {}) });
      continue;
    }
    if (Array.isArray(rawValue)) {
      const items = rawValue
        .map((row) => (typeof row === "string" ? row.trim() : ""))
        .filter((row) => row.length > 0);
      if (items.length === 0) continue;
      facts.push({ label, value: items, ...(href ? { href } : {}) });
    }
  }

  return facts;
}

function normalizeSections(
  value: unknown,
  fallback: CaseDraft["sections"]
): CaseDraft["sections"] {
  if (!Array.isArray(value)) return fallback;

  const sections: CaseDraft["sections"] = [];
  for (const row of value) {
    const record = asRecord(row);
    const title = pickNonEmpty(record?.title);
    const blocks = normalizeBlocks(record?.blocks);
    if (!title || blocks.length === 0) continue;
    sections.push({ title, blocks });
  }

  return sections;
}

function normalizeBlocks(value: unknown): CaseBlock[] {
  if (!Array.isArray(value)) return [];

  const blocks: CaseBlock[] = [];
  for (const row of value) {
    const record = asRecord(row);
    const discriminant = pickNonEmpty(record?.discriminant);
    const blockValue = asRecord(record?.value);
    if (!discriminant || !blockValue) continue;

    if (discriminant === "paragraph") {
      const text = pickNonEmpty(blockValue.text);
      if (text) {
        blocks.push({ discriminant: "paragraph", value: { text } });
      }
      continue;
    }

    if (discriminant === "list") {
      const items = Array.isArray(blockValue.items)
        ? blockValue.items
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item.length > 0)
        : [];
      if (items.length > 0) {
        blocks.push({ discriminant: "list", value: { items } });
      }
      continue;
    }

    if (discriminant === "link") {
      const label = pickNonEmpty(blockValue.label);
      const href = pickNonEmpty(blockValue.href);
      if (label && href) {
        blocks.push({ discriminant: "link", value: { label, href } });
      }
      continue;
    }

    if (discriminant === "media") {
      const src = pickNonEmpty(blockValue.src);
      const alt = pickNonEmpty(blockValue.alt);
      const caption = pickNonEmpty(blockValue.caption);
      if (src && alt) {
        blocks.push({
          discriminant: "media",
          value: {
            src,
            alt,
            ...(caption ? { caption } : {}),
          },
        });
      }
    }
  }

  return blocks;
}

function pickNonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function readOpenAiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    return payload.error?.message || fallback;
  } catch {
    return fallback;
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

const SYSTEM_PROMPT = [
  "You are a senior UX and product design case-writer.",
  "Given repository artifacts, generate an evidence-grounded case draft.",
  "Important:",
  "- Do not invent metrics if not explicitly present in sources.",
  "- Keep language specific and concrete, avoid generic fluff.",
  "- Preserve the required section structure.",
  "- Output valid JSON with key `draft` only.",
].join("\n");

