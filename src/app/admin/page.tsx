"use client";

import { useEffect, useMemo, useState } from "react";
import {
  analyzeCaseDraftQuality,
  type DraftQualityIssue,
  type DraftQualityReport,
} from "@/lib/case-draft-quality";

interface Fact {
  label: string;
  value: string | string[];
}

interface Block {
  discriminant: "paragraph" | "list" | "link" | "media";
  value: {
    text?: string;
    items?: string[];
    label?: string;
    href?: string;
    src?: string;
    alt?: string;
    caption?: string;
  };
}

interface Section {
  title: string;
  blocks: Block[];
}

interface SeoData {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
  facts: Fact[];
  sections: Section[];
  seo?: SeoData;
}

interface CaseInfo {
  slug: string;
  title: string;
}

interface UploadSizeInfo {
  beforeBytes: number;
  afterBytes: number;
}

interface UploadApiResponse {
  error?: string | { message?: string };
  warning?: string;
  size?: UploadSizeInfo;
  svgOptimization?: {
    optimized: boolean;
    originalBytes: number;
    optimizedBytes: number;
    usedAggressivePass: boolean;
  };
}

interface MediaUploadFeedback {
  fileName?: string;
  uploading?: boolean;
  uploaded?: boolean;
  sizeText?: string;
  processedText?: string;
  errorText?: string;
}

interface CaseDraftEnvelope {
  version: 1;
  updatedAt: string;
  data: CaseStudy;
}

type IntakeFocus = "ux-driven" | "behavioral-model" | "agentic-flow";
type AnalysisMode = "llm" | "heuristic";

interface GitHubIntakeApiResponse {
  ok?: boolean;
  draft?: CaseStudy;
  evidence?: string[];
  routeCandidates?: string[];
  runtimeScreenshots?: Array<{
    route: string;
    pageUrl: string;
    screenshotUrl: string;
    status: "planned";
  }>;
  llm?: {
    model?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    commandCount?: number;
  } | null;
  extractor?: {
    requested?: boolean;
    executed?: boolean;
    commandCount?: number;
    imported?: Array<{
      route: string;
      pageUrl: string;
      src: string;
      bytes: number;
      reason?: string;
    }>;
    failed?: Array<{
      route: string;
      pageUrl: string;
      screenshotUrl: string;
      reason?: string;
      error: string;
    }>;
    skippedReason?: string | null;
  } | null;
  error?: string | { message?: string };
}

interface RuntimeImportApiResponse {
  imported?: Array<{
    route: string;
    pageUrl: string;
    src: string;
    bytes: number;
  }>;
  failed?: Array<{
    route: string;
    pageUrl: string;
    screenshotUrl: string;
    reason?: string;
    error: string;
  }>;
  error?: string | { message?: string };
}

const MEDIA_UPLOAD_TIMEOUT_MS = 90_000;
const MAX_CLIENT_UPLOAD_BYTES = 3_500_000; // Keep request below Vercel function payload ceiling.
const DRAFT_STORAGE_PREFIX = "cms-case-draft:";

function getDraftStorageKey(slug: string): string {
  return `${DRAFT_STORAGE_PREFIX}${slug}`;
}

function readCaseDraft(slug: string): CaseDraftEnvelope | null {
  if (typeof window === "undefined" || !slug) return null;
  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CaseDraftEnvelope>;
    if (parsed?.version !== 1 || !parsed.updatedAt || !parsed.data) {
      return null;
    }
    return parsed as CaseDraftEnvelope;
  } catch {
    return null;
  }
}

function writeCaseDraft(slug: string, data: CaseStudy): CaseDraftEnvelope | null {
  if (typeof window === "undefined" || !slug) return null;
  const envelope: CaseDraftEnvelope = {
    version: 1,
    updatedAt: new Date().toISOString(),
    data,
  };
  try {
    window.localStorage.setItem(getDraftStorageKey(slug), JSON.stringify(envelope));
    return envelope;
  } catch {
    return null;
  }
}

function clearCaseDraft(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    window.localStorage.removeItem(getDraftStorageKey(slug));
  } catch {
    // ignore localStorage failures
  }
}

function formatDraftTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [cases, setCases] = useState<CaseInfo[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [caseData, setCaseData] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reloadingLatest, setReloadingLatest] = useState(false);
  const [hasContentConflict, setHasContentConflict] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [draggedBlock, setDraggedBlock] = useState<{sectionIndex: number, blockIndex: number} | null>(null);
  const [mediaUploadFeedbackByBlock, setMediaUploadFeedbackByBlock] = useState<
    Record<string, MediaUploadFeedback>
  >({});
  const [availableDraft, setAvailableDraft] = useState<CaseDraftEnvelope | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [newCaseSlug, setNewCaseSlug] = useState("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [creatingCase, setCreatingCase] = useState(false);
  const [githubRepoUrl, setGitHubRepoUrl] = useState("");
  const [githubFocus, setGitHubFocus] = useState<IntakeFocus>("ux-driven");
  const [githubAnalysisMode, setGitHubAnalysisMode] = useState<AnalysisMode>("llm");
  const [githubRuntimeBaseUrl, setGitHubRuntimeBaseUrl] = useState("");
  const [githubScreenshotLimit, setGitHubScreenshotLimit] = useState(6);
  const [generatingGitHubDraft, setGeneratingGitHubDraft] = useState(false);
  const [githubEvidence, setGitHubEvidence] = useState<string[]>([]);
  const [githubRouteCandidates, setGitHubRouteCandidates] = useState<string[]>([]);
  const [githubRuntimeScreenshots, setGitHubRuntimeScreenshots] = useState<
    Array<{
      route: string;
      pageUrl: string;
      screenshotUrl: string;
      status: "planned";
    }>
  >([]);
  const [importingRuntimeScreenshots, setImportingRuntimeScreenshots] = useState(false);
  const [githubLlmInfo, setGitHubLlmInfo] = useState<GitHubIntakeApiResponse["llm"]>(null);
  const draftQualityReport: DraftQualityReport | null = useMemo(() => {
    if (!caseData) return null;
    return analyzeCaseDraftQuality(caseData, { evidenceLinks: githubEvidence });
  }, [caseData, githubEvidence]);

  const getBlockKey = (sectionIndex: number, blockIndex: number): string =>
    `${sectionIndex}:${blockIndex}`;

  // Load list of cases
  useEffect(() => {
    fetch("/api/cases", { cache: "no-store" })
      .then((r) => r.json())
      .then((payload: { items?: CaseInfo[] }) => {
        const data = Array.isArray(payload.items) ? payload.items : [];
        setCases(data);
        if (data.length > 0) {
          setSelectedCase(data[0].slug);
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage("❌ Failed to load cases");
        setLoading(false);
      });
  }, []);

  const loadCaseContent = async (slug: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cases/${slug}`, { cache: "no-store" });
      const payload = (await response.json()) as { item?: CaseStudy };
      if (response.ok && payload.item) {
        setCaseData(payload.item);
        const draft = readCaseDraft(slug);
        setDraftSavedAt(draft?.updatedAt ?? null);
        if (draft && JSON.stringify(draft.data) !== JSON.stringify(payload.item)) {
          setAvailableDraft(draft);
        } else {
          setAvailableDraft(null);
        }
        return true;
      }
      setMessage("❌ Failed to load case content");
      return false;
    } catch {
      setMessage("❌ Failed to load case content");
      return false;
    }
  };

  // Load selected case content
  useEffect(() => {
    if (!selectedCase) return;
    setMediaUploadFeedbackByBlock({});
    setAvailableDraft(null);
    setDraftSavedAt(null);
    void loadCaseContent(selectedCase);
  }, [selectedCase]);

  const updateField = <K extends keyof CaseStudy>(field: K, value: CaseStudy[K]) => {
    if (!caseData) return;
    const nextCaseData = { ...caseData, [field]: value };
    setCaseData(nextCaseData);
    const savedDraft = writeCaseDraft(selectedCase, nextCaseData);
    if (savedDraft) {
      setDraftSavedAt(savedDraft.updatedAt);
      setAvailableDraft(null);
    }
  };

  const updateFact = (index: number, field: keyof Fact, value: string | string[]) => {
    if (!caseData) return;
    const newFacts = [...caseData.facts];
    newFacts[index] = { ...newFacts[index], [field]: value };
    updateField("facts", newFacts);
  };

  const updateSeo = (field: keyof SeoData, value: string) => {
    if (!caseData) return;
    const newSeo = { ...(caseData.seo || {}), [field]: value };
    updateField("seo", newSeo);
  };

  const addFact = () => {
    if (!caseData) return;
    updateField("facts", [...caseData.facts, { label: "", value: "" }]);
  };

  const removeFact = (index: number) => {
    if (!caseData) return;
    updateField("facts", caseData.facts.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatUploadSizeDelta = (size?: UploadSizeInfo): string => {
    if (!size) return "";
    return `${formatBytes(size.beforeBytes)} → ${formatBytes(size.afterBytes)}`;
  };

  const formatSingleFileSize = (bytes: number): string => formatBytes(bytes);

  const deriveAltFromFileName = (fileName: string): string => {
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const normalized = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return normalized || "Image";
  };

  const getUploadSizeLimitError = (fileSizeBytes: number): string =>
    `File is too large (${formatSingleFileSize(fileSizeBytes)}). CMS upload limit is approximately ${formatSingleFileSize(MAX_CLIENT_UPLOAD_BYTES)} per file. Please export a smaller asset and retry.`;

  const getApiErrorMessage = (payload: unknown): string => {
    if (typeof payload !== "object" || payload === null) {
      return "Unknown error";
    }
    const record = payload as Record<string, unknown>;
    const error = record.error;
    if (typeof error === "string" && error) {
      return error;
    }
    if (typeof error === "object" && error !== null) {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string" && message) {
        return message;
      }
    }
    return "Unknown error";
  };

  const getApiErrorCode = (payload: unknown): string | undefined => {
    if (typeof payload !== "object" || payload === null) {
      return undefined;
    }
    const error = (payload as Record<string, unknown>).error;
    if (typeof error === "object" && error !== null) {
      const code = (error as Record<string, unknown>).code;
      if (typeof code === "string" && code) {
        return code;
      }
    }
    return undefined;
  };

  const readUploadErrorMessage = async (response: Response): Promise<string> => {
    try {
      const text = (await response.text()).trim();
      if (text) {
        try {
          const parsed = JSON.parse(text) as unknown;
          const parsedMessage = getApiErrorMessage(parsed);
          if (parsedMessage !== "Unknown error") {
            return parsedMessage;
          }
        } catch {
          // Non-JSON error payload (e.g. HTML or plain text from platform/runtime)
        }
        return text;
      }
    } catch {
      // ignore and fallback to status message
    }

    if (response.status) {
      return response.statusText
        ? `HTTP ${response.status} ${response.statusText}`
        : `HTTP ${response.status}`;
    }

    return "Unknown error";
  };

  const normalizeUploadErrorMessage = (rawMessage: string): string => {
    const normalized = rawMessage.trim();
    const lower = normalized.toLowerCase();
    if (
      lower.includes("function_payload_too_large") ||
      lower.includes("request entity too large") ||
      lower.includes("payload too large")
    ) {
      return `Upload payload exceeds platform limit. Keep files below approximately ${formatSingleFileSize(MAX_CLIENT_UPLOAD_BYTES)} and retry.`;
    }
    return normalized || "Unknown error";
  };

  const validateCase = (data: CaseStudy): string | null => {
    if (!data.title.trim()) return "Title is required";
    if (!data.slug.trim()) return "Slug is required";
    if (!data.coverAlt.trim()) return "Cover alt text is required";
    // Check for empty fact labels
    const emptyFact = data.facts.find(f => !f.label.trim());
    if (emptyFact) return "All fact labels must be filled";
    // Check for empty section titles
    const emptySection = data.sections.find(s => !s.title.trim());
    if (emptySection) return "All section titles must be filled";
    return null;
  };

  const handleSave = async () => {
    if (!caseData) return;
    const hasUploadingMedia = Object.values(mediaUploadFeedbackByBlock).some(
      (feedback) => feedback.uploading
    );
    if (hasUploadingMedia || uploading) {
      setMessage("⏳ Please wait for media uploads to finish before saving.");
      return;
    }

    const error = validateCase(caseData);
    if (error) {
      setMessage(`❌ ${error}`);
      return;
    }

    if ((draftQualityReport?.summary.critical || 0) > 0) {
      const shouldSaveAnyway = window.confirm(
        `Detected ${draftQualityReport?.summary.critical} critical quality issue(s). Save anyway?`
      );
      if (!shouldSaveAnyway) {
        setMessage("⚠️ Save cancelled. Resolve critical quality issues first.");
        return;
      }
    }

    setSaving(true);
    setMessage("");
    setHasContentConflict(false);

    const path = `src/content/cases/${selectedCase}.json`;

    const response = await fetch("/api/save-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        content: caseData,
        message: `Update ${selectedCase} case`,
      }),
    });

    const result = (await response.json()) as Record<string, unknown>;

    if (response.ok) {
      setMessage("✅ Saved! Changes will deploy in ~1 minute.");
      clearCaseDraft(selectedCase);
      setAvailableDraft(null);
      setDraftSavedAt(null);
    } else {
      const errorCode = getApiErrorCode(result);
      if (errorCode === "CONTENT_CONFLICT") {
        setHasContentConflict(true);
        setMessage("⚠️ Conflict: content changed in repository. Reload latest version, review, then save again.");
      } else {
        setMessage(`❌ Error: ${getApiErrorMessage(result)}`);
      }
    }
    setSaving(false);
  };

  const handleRestoreDraft = () => {
    if (!availableDraft) return;
    setCaseData(availableDraft.data);
    setDraftSavedAt(availableDraft.updatedAt);
    setAvailableDraft(null);
    setMessage(`✅ Restored local draft from ${formatDraftTimestamp(availableDraft.updatedAt)}.`);
  };

  const handleDiscardDraft = () => {
    clearCaseDraft(selectedCase);
    setAvailableDraft(null);
    setDraftSavedAt(null);
    setMessage("🗑️ Local draft discarded.");
  };

  const handleReloadLatestCase = async () => {
    if (!selectedCase) return;
    setReloadingLatest(true);
    const loaded = await loadCaseContent(selectedCase);
    if (loaded) {
      setHasContentConflict(false);
      setMessage("✅ Loaded latest content from repository. Review and save again.");
    }
    setReloadingLatest(false);
  };

  const normalizeSlugInput = (value: string): string =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");

  const handleCreateCase = async () => {
    const slug = normalizeSlugInput(newCaseSlug);
    const title = newCaseTitle.trim();

    if (!slug) {
      setMessage("❌ New case slug is required.");
      return;
    }
    if (!title) {
      setMessage("❌ New case title is required.");
      return;
    }
    if (cases.some((item) => item.slug === slug)) {
      setMessage(`❌ Case "${slug}" already exists.`);
      return;
    }

    const template: CaseStudy = {
      slug,
      title,
      subtitle: "Short case summary.",
      coverSrc: "/cases/example/cover.png",
      coverAlt: `${title} cover`,
      facts: [
        { label: "role", value: "Product Designer" },
        { label: "scope", value: "End-to-end product design" },
      ],
      sections: [
        {
          title: "Context",
          blocks: [{ discriminant: "paragraph", value: { text: "Describe product and business context." } }],
        },
        {
          title: "Problem",
          blocks: [{ discriminant: "paragraph", value: { text: "Describe the core user or system problem." } }],
        },
        {
          title: "Constraints",
          blocks: [{ discriminant: "list", value: { items: ["Constraint 1", "Constraint 2"] } }],
        },
        {
          title: "Role",
          blocks: [{ discriminant: "paragraph", value: { text: "Explain your responsibility and ownership boundaries." } }],
        },
        {
          title: "Approach",
          blocks: [{ discriminant: "paragraph", value: { text: "Describe your design and discovery approach." } }],
        },
        {
          title: "Solution",
          blocks: [{ discriminant: "paragraph", value: { text: "Describe what was designed and implemented." } }],
        },
        {
          title: "Outcome",
          blocks: [{ discriminant: "paragraph", value: { text: "Describe measurable or observed outcomes." } }],
        },
      ],
      seo: {
        metaTitle: `${title} | Case Study`,
        metaDescription: "Case study",
        ogImage: "/cases/example/cover.png",
      },
    };

    setCreatingCase(true);
    setMessage("");
    try {
      const path = `src/content/cases/${slug}.json`;
      const response = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          content: template,
          message: `Create ${slug} case via CMS`,
        }),
      });

      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        setMessage(`❌ Failed to create case: ${getApiErrorMessage(payload)}`);
        return;
      }

      const nextCases = [...cases, { slug, title }].sort((a, b) => a.title.localeCompare(b.title));
      setCases(nextCases);
      setSelectedCase(slug);
      setNewCaseSlug("");
      setNewCaseTitle("");
      setMessage(`✅ Case "${title}" created. Fill content and click Save Changes when ready.`);
    } catch (error) {
      setMessage(
        `❌ Failed to create case: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCreatingCase(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !caseData) return;
    if (selectedFile.size > MAX_CLIENT_UPLOAD_BYTES) {
      setMessage(`❌ Upload failed: ${getUploadSizeLimitError(selectedFile.size)}`);
      return;
    }
    setUploading(true);
    setMessage("");

    const ext = selectedFile.name.split(".").pop();
    const path = `public/cases/${selectedCase}/${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("path", path);

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        let result: UploadApiResponse = {};
        try {
          result = (await response.json()) as UploadApiResponse;
        } catch {
          result = {};
        }

        // Update coverSrc with new path (relative to public)
        const publicPath = path.replace(/^public/, "");
        updateField("coverSrc", publicPath);
        const sizeDelta = formatUploadSizeDelta(result.size);
        setMessage(`✅ Image uploaded${sizeDelta ? ` (${sizeDelta})` : ""}`);
        setSelectedFile(null);
        setImageCaption("");
      } else {
        const apiError = normalizeUploadErrorMessage(await readUploadErrorMessage(response));
        setMessage(`❌ Upload failed: ${apiError}`);
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Network error";
      setMessage(`❌ Upload failed: ${normalizeUploadErrorMessage(message)}`);
    } finally {
      setUploading(false);
    }
  };

  // Upload image for media block
  const handleUploadMediaImage = async (
    sectionIndex: number,
    blockIndex: number,
    file: File
  ) => {
    if (!caseData || !file) return;
    if (file.size > MAX_CLIENT_UPLOAD_BYTES) {
      const sizeError = getUploadSizeLimitError(file.size);
      setMessage(`❌ Upload failed: ${sizeError}`);
      const blockKey = getBlockKey(sectionIndex, blockIndex);
      setMediaUploadFeedbackByBlock((prev) => ({
        ...prev,
        [blockKey]: {
          fileName: file.name,
          uploading: false,
          uploaded: false,
          errorText: sizeError,
        },
      }));
      return;
    }
    setMessage("");
    const blockKey = getBlockKey(sectionIndex, blockIndex);
    setMediaUploadFeedbackByBlock((prev) => ({
      ...prev,
      [blockKey]: {
        fileName: file.name,
        uploading: true,
      },
    }));

    const ext = file.name.split(".").pop();
    const path = `public/cases/${selectedCase}/${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), MEDIA_UPLOAD_TIMEOUT_MS);
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        let result: UploadApiResponse = {};
        try {
          result = (await response.json()) as UploadApiResponse;
        } catch {
          result = {};
        }

        const publicPath = path.replace(/^public/, "");
        const currentAlt = caseData.sections[sectionIndex]?.blocks[blockIndex]?.value.alt?.trim();
        const nextAlt = currentAlt || deriveAltFromFileName(file.name);
        updateBlock(sectionIndex, blockIndex, { src: publicPath, alt: nextAlt });
        const sizeDelta = formatUploadSizeDelta(result.size);
        setMessage(`✅ Image uploaded to media block${sizeDelta ? ` (${sizeDelta})` : ""}`);
        const processedText = result.svgOptimization
          ? result.svgOptimization.optimized
            ? "SVG optimized"
            : "SVG checked (no changes)"
          : "File processed";
        setMediaUploadFeedbackByBlock((prev) => ({
          ...prev,
          [blockKey]: {
            fileName: file.name,
            uploading: false,
            uploaded: true,
            sizeText: sizeDelta || formatSingleFileSize(file.size),
            processedText,
          },
        }));
        return;
      }

      const apiError = normalizeUploadErrorMessage(await readUploadErrorMessage(response));
      setMessage(`❌ Upload failed: ${apiError}`);
      setMediaUploadFeedbackByBlock((prev) => ({
        ...prev,
        [blockKey]: {
          fileName: file.name,
          uploading: false,
          uploaded: false,
          errorText: apiError,
        },
      }));
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const isTimeout =
        error instanceof DOMException && error.name === "AbortError";
      const message =
        isTimeout
          ? `Upload timeout after ${Math.round(MEDIA_UPLOAD_TIMEOUT_MS / 1000)}s`
          : error instanceof Error && error.message
            ? error.message
            : "Network error";
      const normalizedMessage = normalizeUploadErrorMessage(message);
      setMessage(`❌ Upload failed: ${normalizedMessage}`);
      setMediaUploadFeedbackByBlock((prev) => ({
        ...prev,
        [blockKey]: {
          fileName: file.name,
          uploading: false,
          uploaded: false,
          errorText: normalizedMessage,
        },
      }));
    }
  };

  const applyGeneratedDraft = (draft: CaseStudy) => {
    const normalizedDraft: CaseStudy = {
      ...draft,
      slug: selectedCase,
      title: draft.title || caseData?.title || selectedCase,
      subtitle: draft.subtitle || caseData?.subtitle || "",
      coverSrc: draft.coverSrc || "/cases/example/cover.png",
      coverAlt: draft.coverAlt || `${draft.title || selectedCase} cover`,
      facts: Array.isArray(draft.facts) ? draft.facts : [],
      sections: Array.isArray(draft.sections) ? draft.sections : [],
    };

    setCaseData(normalizedDraft);
    const savedDraft = writeCaseDraft(selectedCase, normalizedDraft);
    if (savedDraft) {
      setDraftSavedAt(savedDraft.updatedAt);
      setAvailableDraft(null);
    }
  };

  const handleGenerateGitHubDraft = async () => {
    if (!githubRepoUrl.trim()) {
      setMessage("❌ GitHub repository URL is required.");
      return;
    }

    setGeneratingGitHubDraft(true);
    setMessage("");
    try {
      const response = await fetch("/api/intake/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: githubRepoUrl.trim(),
          focus: githubFocus,
          analysisMode: githubAnalysisMode,
          runExtractor: true,
          runtimeBaseUrl: githubRuntimeBaseUrl.trim() || undefined,
          screenshotLimit: githubScreenshotLimit,
        }),
      });

      const payload = (await response.json()) as GitHubIntakeApiResponse;
      if (!response.ok || !payload.draft) {
        setMessage(`❌ Draft generation failed: ${getApiErrorMessage(payload)}`);
        return;
      }

      setGitHubEvidence(Array.isArray(payload.evidence) ? payload.evidence : []);
      setGitHubRouteCandidates(
        Array.isArray(payload.routeCandidates) ? payload.routeCandidates : []
      );
      setGitHubRuntimeScreenshots(
        Array.isArray(payload.runtimeScreenshots) ? payload.runtimeScreenshots : []
      );
      setGitHubLlmInfo(payload.llm ?? null);

      const shouldApply = window.confirm(
        "Replace current case form with generated draft? Local draft is still available via browser storage."
      );

      if (!shouldApply) {
        setMessage("ℹ️ Draft generated. Apply cancelled.");
        return;
      }

      applyGeneratedDraft(payload.draft);
      const extractorImportedCount = Array.isArray(payload.extractor?.imported)
        ? payload.extractor?.imported.length
        : 0;
      const extractorFailedCount = Array.isArray(payload.extractor?.failed)
        ? payload.extractor?.failed.length
        : 0;
      const extractorStatus = payload.extractor?.requested
        ? payload.extractor.executed
          ? ` Extractor imported ${extractorImportedCount}${
              extractorFailedCount ? ` (${extractorFailedCount} failed)` : ""
            }.`
          : payload.extractor.skippedReason
            ? ` Extractor skipped: ${payload.extractor.skippedReason}`
            : ""
        : "";

      setMessage(
        `✅ GitHub draft generated and applied. Review sections, then save.${extractorStatus}`
      );
    } catch (error) {
      setMessage(
        `❌ Draft generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setGeneratingGitHubDraft(false);
    }
  };

  const handleImportRuntimeScreenshots = async () => {
    if (!caseData || githubRuntimeScreenshots.length === 0) {
      setMessage("❌ No runtime screenshots to import.");
      return;
    }

    setImportingRuntimeScreenshots(true);
    setMessage("");
    try {
      const response = await fetch("/api/intake/github/runtime-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedCase,
          screenshots: githubRuntimeScreenshots,
        }),
      });

      const payload = (await response.json()) as RuntimeImportApiResponse;
      if (!response.ok) {
        setMessage(`❌ Runtime import failed: ${getApiErrorMessage(payload)}`);
        return;
      }

      const imported = Array.isArray(payload.imported) ? payload.imported : [];
      const failed = Array.isArray(payload.failed) ? payload.failed : [];

      if (imported.length === 0) {
        setMessage(
          `❌ Runtime import finished with no imported screenshots.${failed.length ? " See failed list." : ""}`
        );
        return;
      }

      const byRoute = new Map(imported.map((item) => [item.route, item.src]));
      const nextSections = caseData.sections.map((section) => {
        if (section.title !== "Visual Artifacts") {
          return section;
        }

        return {
          ...section,
          blocks: section.blocks.map((block) => {
            if (block.discriminant !== "media") {
              return block;
            }

            const routeMatch = (block.value.alt || "").match(/runtime screenshot\s+(.+)$/i);
            const route = routeMatch?.[1]?.trim();
            if (!route) {
              return block;
            }

            const src = byRoute.get(route);
            if (!src) {
              return block;
            }

            return {
              ...block,
              value: {
                ...block.value,
                src,
                caption: `Runtime screenshot ${route} (imported)`,
              },
            };
          }),
        };
      });

      updateField("sections", nextSections);
      setMessage(
        `✅ Imported ${imported.length} runtime screenshots${
          failed.length ? ` (${failed.length} failed)` : ""
        }.`
      );
    } catch (error) {
      setMessage(
        `❌ Runtime import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setImportingRuntimeScreenshots(false);
    }
  };

  // Section management
  const updateSection = (sectionIndex: number, field: keyof Section, value: string) => {
    if (!caseData) return;
    const newSections = [...caseData.sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value };
    updateField("sections", newSections);
  };

  const addSection = () => {
    if (!caseData) return;
    updateField("sections", [
      ...caseData.sections,
      { title: "", blocks: [{ discriminant: "paragraph", value: { text: "" } }] },
    ]);
  };

  const removeSection = (index: number) => {
    if (!caseData) return;
    updateField("sections", caseData.sections.filter((_, i) => i !== index));
  };

  // Block management
  const updateBlock = (sectionIndex: number, blockIndex: number, value: Partial<Block["value"]>) => {
    if (!caseData) return;
    const newSections = [...caseData.sections];
    const newBlocks = [...newSections[sectionIndex].blocks];
    newBlocks[blockIndex] = { ...newBlocks[blockIndex], value: { ...newBlocks[blockIndex].value, ...value } };
    newSections[sectionIndex] = { ...newSections[sectionIndex], blocks: newBlocks };
    updateField("sections", newSections);
  };

  const addBlock = (sectionIndex: number, type: Block["discriminant"]) => {
    if (!caseData) return;
    const newSections = [...caseData.sections];
    const defaultValue: Record<Block["discriminant"], Block["value"]> = {
      paragraph: { text: "" },
      list: { items: [""] },
      link: { label: "", href: "" },
      media: { src: "", alt: "", caption: "" },
    };
    const newBlocks = [...newSections[sectionIndex].blocks, { discriminant: type, value: defaultValue[type] }];
    newSections[sectionIndex] = { ...newSections[sectionIndex], blocks: newBlocks };
    updateField("sections", newSections);
  };

  const removeBlock = (sectionIndex: number, blockIndex: number) => {
    if (!caseData) return;
    const newSections = [...caseData.sections];
    const newBlocks = newSections[sectionIndex].blocks.filter((_, i) => i !== blockIndex);
    newSections[sectionIndex] = { ...newSections[sectionIndex], blocks: newBlocks };
    updateField("sections", newSections);
  };

  const moveBlock = (sectionIndex: number, fromIndex: number, toIndex: number) => {
    if (!caseData || fromIndex === toIndex) return;
    const newSections = [...caseData.sections];
    const blocks = [...newSections[sectionIndex].blocks];
    const [movedBlock] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, movedBlock);
    newSections[sectionIndex] = { ...newSections[sectionIndex], blocks };
    updateField("sections", newSections);
  };

  const inputStyle = {
    padding: "8px 12px",
    fontSize: 16,
    borderRadius: "var(--radius-1)",
    border: "1px solid var(--color-border-subtle)",
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-primary)",
    width: "100%",
  };

  const labelStyle = { display: "block", marginBottom: 8, fontWeight: 600 };
  const fieldStyle = { marginBottom: 16 };
  const hasUploadingMedia = Object.values(mediaUploadFeedbackByBlock).some(
    (feedback) => feedback.uploading
  );
  const sortedDraftIssues = (draftQualityReport?.issues || []).slice().sort((a, b) => {
    return severityRank(a.severity) - severityRank(b.severity);
  });
  const topDraftIssues = sortedDraftIssues.slice(0, 8);

  if (loading || !caseData) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>Content Admin</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Content Admin</h1>

      <div style={fieldStyle}>
        <label style={labelStyle}>Create new case:</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            value={newCaseSlug}
            onChange={(e) => setNewCaseSlug(normalizeSlugInput(e.target.value))}
            style={{ ...inputStyle, width: 240, flex: "0 0 240px" }}
            placeholder="slug (e.g. new-case)"
          />
          <input
            type="text"
            value={newCaseTitle}
            onChange={(e) => setNewCaseTitle(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 260 }}
            placeholder="Case title"
          />
          <button
            onClick={handleCreateCase}
            disabled={creatingCase}
            style={{
              padding: "10px 14px",
              background: creatingCase ? "#999" : "#0ea5e9",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-1)",
              cursor: creatingCase ? "not-allowed" : "pointer",
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            {creatingCase ? "Creating..." : "Create Case"}
          </button>
        </div>
      </div>

      {draftQualityReport ? (
        <div
          style={{
            ...fieldStyle,
            padding: 12,
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-1)",
            background: "var(--color-bg-secondary)",
          }}
        >
          <label style={labelStyle}>Draft Quality Checklist</label>
          <p style={{ marginTop: 0, fontSize: 13 }}>
            Score: <strong>{draftQualityReport.score}/100</strong>
            {" • "}
            Critical: <strong>{draftQualityReport.summary.critical}</strong>
            {" • "}
            Warnings: <strong>{draftQualityReport.summary.warning}</strong>
          </p>
          {topDraftIssues.length > 0 ? (
            <ul style={{ marginTop: 0, paddingLeft: 18 }}>
              {topDraftIssues.map((issue, index) => (
                <li key={`${issue.id}-${index}`} style={{ marginBottom: 4 }}>
                  <strong>{issue.severity.toUpperCase()}</strong>: {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: 0, fontSize: 13 }}>No quality issues detected.</p>
          )}
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: "pointer", fontSize: 13 }}>
              Checklist ({draftQualityReport.checklist.filter((item) => item.passed).length}/
              {draftQualityReport.checklist.length} passed)
            </summary>
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              {draftQualityReport.checklist.map((item) => (
                <li key={item.id} style={{ marginBottom: 4 }}>
                  {item.passed ? "✅" : "⚠️"} {item.label}
                  {item.details ? ` — ${item.details}` : ""}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}

      <div style={fieldStyle}>
        <label style={labelStyle}>Select case:</label>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          style={inputStyle}
        >
          {cases.map((c: CaseInfo) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          ...fieldStyle,
          padding: 12,
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius-1)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <label style={labelStyle}>AI Intake (GitHub)</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            value={githubRepoUrl}
            onChange={(e) => setGitHubRepoUrl(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 320 }}
            placeholder="https://github.com/owner/repo"
          />
          <select
            value={githubFocus}
            onChange={(e) => setGitHubFocus(e.target.value as IntakeFocus)}
            style={{ ...inputStyle, width: 200, flex: "0 0 200px" }}
          >
            <option value="ux-driven">UX-driven</option>
            <option value="behavioral-model">Behavioral model</option>
            <option value="agentic-flow">Agentic flow</option>
          </select>
          <select
            value={githubAnalysisMode}
            onChange={(e) => setGitHubAnalysisMode(e.target.value as AnalysisMode)}
            style={{ ...inputStyle, width: 170, flex: "0 0 170px" }}
          >
            <option value="llm">LLM analysis</option>
            <option value="heuristic">Heuristic</option>
          </select>
          <button
            onClick={handleGenerateGitHubDraft}
            disabled={generatingGitHubDraft}
            style={{
              padding: "10px 14px",
              background: generatingGitHubDraft ? "#999" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-1)",
              cursor: generatingGitHubDraft ? "not-allowed" : "pointer",
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            {generatingGitHubDraft ? "Generating..." : "Generate Draft"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <input
            type="text"
            value={githubRuntimeBaseUrl}
            onChange={(e) => setGitHubRuntimeBaseUrl(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 320 }}
            placeholder="Runtime URL for screenshot crawl (optional), e.g. https://my-app.vercel.app"
          />
          <input
            type="number"
            min={1}
            max={12}
            value={githubScreenshotLimit}
            onChange={(e) =>
              setGitHubScreenshotLimit(
                Math.max(1, Math.min(12, Number.parseInt(e.target.value || "6", 10) || 6))
              )
            }
            style={{ ...inputStyle, width: 140, flex: "0 0 140px" }}
            placeholder="Shots"
          />
        </div>
        <p style={{ fontSize: 12, marginTop: 8, color: "var(--color-text-muted)" }}>
          Generates a draft from README + issues + merged PRs. LLM mode uses model synthesis;
          heuristic mode uses deterministic mapping. Runtime URL optionally enables route and screenshot planning.
        </p>
        {githubLlmInfo?.model ? (
          <p style={{ fontSize: 12, marginTop: 6, color: "var(--color-text-muted)" }}>
            LLM: {githubLlmInfo.model}
            {githubLlmInfo.usage?.totalTokens
              ? ` • tokens: ${githubLlmInfo.usage.totalTokens}`
              : ""}
          </p>
        ) : null}
        {githubEvidence.length > 0 ? (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: "pointer", fontSize: 13 }}>
              Evidence links ({githubEvidence.length})
            </summary>
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              {githubEvidence.slice(0, 8).map((href) => (
                <li key={href} style={{ marginBottom: 4, overflowWrap: "anywhere" }}>
                  <a href={href} target="_blank" rel="noreferrer">
                    {href}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        {githubRouteCandidates.length > 0 ? (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: "pointer", fontSize: 13 }}>
              Route candidates ({githubRouteCandidates.length})
            </summary>
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              {githubRouteCandidates.slice(0, 12).map((route) => (
                <li key={route} style={{ marginBottom: 4 }}>
                  <code>{route}</code>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        {githubRuntimeScreenshots.length > 0 ? (
          <div style={{ marginTop: 8 }}>
            <details>
              <summary style={{ cursor: "pointer", fontSize: 13 }}>
                Runtime screenshot plan ({githubRuntimeScreenshots.length})
              </summary>
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {githubRuntimeScreenshots.slice(0, 8).map((shot) => (
                  <li key={`${shot.route}-${shot.pageUrl}`} style={{ marginBottom: 6 }}>
                    <div>
                      <code>{shot.route}</code>
                      {" -> "}
                      <a href={shot.pageUrl} target="_blank" rel="noreferrer">
                        page
                      </a>{" "}
                      /{" "}
                      <a href={shot.screenshotUrl} target="_blank" rel="noreferrer">
                        screenshot
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
            <button
              onClick={handleImportRuntimeScreenshots}
              disabled={importingRuntimeScreenshots}
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: importingRuntimeScreenshots ? "#999" : "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-1)",
                cursor: importingRuntimeScreenshots ? "not-allowed" : "pointer",
                fontSize: 13,
              }}
            >
              {importingRuntimeScreenshots
                ? "Importing Runtime Screenshots..."
                : "Import Runtime Screenshots"}
            </button>
          </div>
        ) : null}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Title:</label>
        <input
          type="text"
          value={caseData.title}
          onChange={(e) => updateField("title", e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Subtitle:</label>
        <textarea
          value={caseData.subtitle}
          onChange={(e) => updateField("subtitle", e.target.value)}
          style={{ ...inputStyle, minHeight: 80, height: "auto", resize: "vertical", fontFamily: "inherit" }}
          rows={3}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Cover Image:</label>
        <input
          type="text"
          value={caseData.coverSrc}
          onChange={(e) => updateField("coverSrc", e.target.value)}
          style={inputStyle}
          placeholder="/cases/example/cover.png"
        />

        {/* Upload section */}
        <div style={{ marginTop: 12, padding: 12, border: "1px dashed var(--color-border-subtle)", borderRadius: "var(--radius-1)" }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={{ marginBottom: 8, color: "var(--color-text-primary)" }}
          />
          {selectedFile && (
            <div style={{ marginBottom: 8, fontSize: 14, color: "var(--color-text-muted)" }}>
              Selected: {selectedFile.name}
            </div>
          )}
          <div style={fieldStyle}>
            <label style={{ ...labelStyle, fontSize: 14 }}>Caption (for media blocks):</label>
            <input
              type="text"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              style={{ ...inputStyle, fontSize: 14 }}
              placeholder="Image caption"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            style={{
              padding: "8px 16px",
              background: uploading || !selectedFile ? "#999" : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-1)",
              cursor: uploading || !selectedFile ? "not-allowed" : "pointer",
              fontSize: 14,
            }}
          >
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
        </div>

        {/* Preview */}
        {caseData.coverSrc && (
          <div style={{ marginTop: 12 }}>
            <img
              src={caseData.coverSrc}
              alt={caseData.coverAlt}
              style={{ maxWidth: 200, maxHeight: 150, borderRadius: "var(--radius-1)", objectFit: "cover" }}
            />
          </div>
        )}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Cover Alt:</label>
        <input
          type="text"
          value={caseData.coverAlt}
          onChange={(e) => updateField("coverAlt", e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* SEO Section */}
      <div style={{ marginTop: 32, marginBottom: 16, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16, fontWeight: 600 }}>SEO Settings</h2>

        <div style={fieldStyle}>
          <label style={labelStyle}>Meta Title (optional):</label>
          <input
            type="text"
            value={caseData.seo?.metaTitle || ""}
            onChange={(e) => updateSeo("metaTitle", e.target.value)}
            style={inputStyle}
            placeholder={`${caseData.title} | Dmitry Ginzburg`}
          />
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4, display: "block" }}>
            Defaults to &quot;{caseData.title} | Dmitry Ginzburg&quot; if empty
          </span>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Meta Description:</label>
          <textarea
            value={caseData.seo?.metaDescription || ""}
            onChange={(e) => updateSeo("metaDescription", e.target.value)}
            style={{ ...inputStyle, height: 80 }}
            placeholder="Brief description for search engines..."
          />
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4, display: "block" }}>
            {(caseData.seo?.metaDescription || "").length}/160 characters
          </span>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>OG Image (optional):</label>
          <input
            type="text"
            value={caseData.seo?.ogImage || ""}
            onChange={(e) => updateSeo("ogImage", e.target.value)}
            style={inputStyle}
            placeholder="/cases/example/og-image.png"
          />
          <span style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4, display: "block" }}>
            Social preview image. Defaults to cover image if empty.
          </span>
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Facts:</label>
        {caseData.facts.map((fact, index) => (
          <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={fact.label}
              onChange={(e) => updateFact(index, "label", e.target.value)}
              style={{ ...inputStyle, width: 150 }}
              placeholder="label"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  <input
                    type="checkbox"
                    checked={Array.isArray(fact.value)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? fact.value ? [fact.value as string] : [""]
                        : Array.isArray(fact.value) && fact.value.length > 0
                          ? fact.value[0]
                          : "";
                      updateFact(index, "value", newValue);
                    }}
                    style={{ marginRight: 4 }}
                  />
                  Multiple values
                </label>
              </div>
              {Array.isArray(fact.value) ? (
                <textarea
                  value={fact.value.join("\n")}
                  onChange={(e) => updateFact(index, "value", e.target.value.split("\n").filter(Boolean))}
                  style={{ ...inputStyle, minHeight: 60, fontFamily: "inherit" }}
                  placeholder="Enter values, one per line"
                />
              ) : (
                <input
                  type="text"
                  value={fact.value}
                  onChange={(e) => updateFact(index, "value", e.target.value)}
                  style={inputStyle}
                  placeholder="value"
                />
              )}
            </div>
            <button
              onClick={() => removeFact(index)}
              style={{
                padding: "8px 12px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-1)",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addFact}
          style={{
            padding: "8px 16px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-1)",
            cursor: "pointer",
          }}
        >
          + Add Fact
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 32, marginBottom: 16 }}>
        <button
          onClick={handleSave}
          disabled={saving || uploading || hasUploadingMedia}
          style={{
            padding: "12px 24px",
            background: saving || uploading || hasUploadingMedia ? "#999" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-1)",
            cursor: saving || uploading || hasUploadingMedia ? "not-allowed" : "pointer",
            fontSize: 16,
          }}
        >
          {saving ? "Saving..." : hasUploadingMedia ? "Uploading media..." : "Save Changes"}
        </button>

        {hasContentConflict && (
          <button
            onClick={handleReloadLatestCase}
            disabled={reloadingLatest}
            style={{
              padding: "12px 24px",
              background: reloadingLatest ? "#999" : "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-1)",
              cursor: reloadingLatest ? "not-allowed" : "pointer",
              fontSize: 16,
            }}
          >
            {reloadingLatest ? "Reloading..." : "Reload Latest"}
          </button>
        )}

        {availableDraft && (
          <>
            <button
              onClick={handleRestoreDraft}
              style={{
                padding: "12px 24px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-1)",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Restore Draft
            </button>
            <button
              onClick={handleDiscardDraft}
              style={{
                padding: "12px 24px",
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-1)",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Discard Draft
            </button>
          </>
        )}

        <button
          onClick={() => setShowJson(!showJson)}
          style={{
            padding: "12px 24px",
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-1)",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          {showJson ? "Hide JSON" : "Show JSON"}
        </button>

        {message && (
          <span style={{ fontSize: 14, color: message.startsWith("✅") ? "green" : "red" }}>
            {message}
          </span>
        )}
      </div>

      {draftSavedAt && (
        <p style={{ marginTop: -8, marginBottom: 20, fontSize: 13, color: "var(--color-text-muted)" }}>
          Draft saved locally at {formatDraftTimestamp(draftSavedAt)}.
        </p>
      )}

      {/* Sections Editor */}
      <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16, fontWeight: 600 }}>Sections</h2>

        {caseData.sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            style={{
              marginBottom: 24,
              padding: 16,
              border: "1px solid var(--color-border-subtle)",
              borderRadius: "var(--radius-1)",
              background: "var(--color-bg)",
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(sectionIndex, "title", e.target.value)}
                style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
                placeholder="Section title"
              />
              <button
                onClick={() => removeSection(sectionIndex)}
                style={{
                  padding: "8px 12px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-1)",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Blocks */}
            {section.blocks.map((block, blockIndex) => (
              <div
                key={blockIndex}
                draggable
                onDragStart={() => setDraggedBlock({ sectionIndex, blockIndex })}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!draggedBlock || draggedBlock.sectionIndex !== sectionIndex) return;
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedBlock || draggedBlock.sectionIndex !== sectionIndex) return;
                  moveBlock(sectionIndex, draggedBlock.blockIndex, blockIndex);
                  setDraggedBlock(null);
                }}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  border: "1px dashed var(--color-border-subtle)",
                  borderRadius: "var(--radius-1)",
                  background: "var(--color-bg-secondary)",
                  cursor: "move",
                  overflow: "visible",
                  opacity: draggedBlock?.sectionIndex === sectionIndex && draggedBlock?.blockIndex === blockIndex ? 0.5 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", textTransform: "uppercase", flex: 1 }}>
                    {block.discriminant}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", userSelect: "none" }}>
                    ↕ Drag to reorder
                  </span>
                </div>

                {block.discriminant === "paragraph" && (
                  <textarea
                    value={block.value.text || ""}
                    onChange={(e) => updateBlock(sectionIndex, blockIndex, { text: e.target.value })}
                    style={{ ...inputStyle, minHeight: 100, height: "auto", resize: "vertical" }}
                    placeholder="Paragraph text..."
                    rows={4}
                  />
                )}

                {block.discriminant === "list" && (
                  <div>
                    {(block.value.items || []).map((item, itemIndex) => (
                      <input
                        key={itemIndex}
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newItems = [...(block.value.items || [])];
                          newItems[itemIndex] = e.target.value;
                          updateBlock(sectionIndex, blockIndex, { items: newItems });
                        }}
                        style={{ ...inputStyle, marginBottom: 4 }}
                        placeholder={`Item ${itemIndex + 1}`}
                      />
                    ))}
                    <button
                      onClick={() => {
                        const newItems = [...(block.value.items || []), ""];
                        updateBlock(sectionIndex, blockIndex, { items: newItems });
                      }}
                      style={{
                        padding: "4px 12px",
                        background: "transparent",
                        color: "var(--color-text-muted)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "var(--radius-1)",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      + Add item
                    </button>
                  </div>
                )}

                {block.discriminant === "link" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={block.value.label || ""}
                      onChange={(e) => updateBlock(sectionIndex, blockIndex, { label: e.target.value })}
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="Link label"
                    />
                    <input
                      type="text"
                      value={block.value.href || ""}
                      onChange={(e) => updateBlock(sectionIndex, blockIndex, { href: e.target.value })}
                      style={{ ...inputStyle, flex: 2 }}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {block.discriminant === "media" && (
                  <div style={{ padding: 12, background: "var(--color-bg)", borderRadius: "var(--radius-1)" }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Image path:</label>
                      <input
                        type="text"
                        value={block.value.src || ""}
                        onChange={(e) => updateBlock(sectionIndex, blockIndex, { src: e.target.value })}
                        style={{ ...inputStyle, marginBottom: 8 }}
                        placeholder="/cases/example/image.png"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const blockKey = getBlockKey(sectionIndex, blockIndex);
                            setMediaUploadFeedbackByBlock((prev) => ({
                              ...prev,
                              [blockKey]: {
                                fileName: file.name,
                                uploading: false,
                                uploaded: false,
                              },
                            }));
                            void handleUploadMediaImage(sectionIndex, blockIndex, file);
                          }
                        }}
                        style={{ fontSize: 14, color: "var(--color-text-primary)" }}
                      />
                      {(() => {
                        const feedback = mediaUploadFeedbackByBlock[getBlockKey(sectionIndex, blockIndex)];
                        if (!feedback) return null;

                        return (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 12,
                              color: "var(--color-text-muted)",
                              display: "grid",
                              gap: 4,
                            }}
                          >
                            <div>
                              {feedback.uploaded ? "✅" : feedback.uploading ? "⏳" : "⬜"}{" "}
                              Uploaded{feedback.fileName ? `: ${feedback.fileName}` : ""}
                            </div>
                            <div>
                              {feedback.sizeText ? "✅" : "⬜"} Size
                              {feedback.sizeText ? `: ${feedback.sizeText}` : ""}
                            </div>
                            <div>
                              {feedback.processedText ? "✅" : "⬜"} Processed
                              {feedback.processedText ? `: ${feedback.processedText}` : ""}
                            </div>
                            {feedback.errorText ? (
                              <div style={{ color: "#f87171" }}>❌ Error: {feedback.errorText}</div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>

                    {block.value.src && (
                      <div style={{ marginBottom: 8 }}>
                        <img
                          src={block.value.src}
                          alt={block.value.alt || ""}
                          style={{ maxWidth: 150, maxHeight: 100, borderRadius: "var(--radius-1)", objectFit: "cover" }}
                        />
                      </div>
                    )}

                    <input
                      type="text"
                      value={block.value.alt || ""}
                      onChange={(e) => updateBlock(sectionIndex, blockIndex, { alt: e.target.value })}
                      style={{ ...inputStyle, fontSize: 14, marginBottom: 8 }}
                      placeholder="Alt text..."
                    />

                    <input
                      type="text"
                      value={block.value.caption || ""}
                      onChange={(e) => updateBlock(sectionIndex, blockIndex, { caption: e.target.value })}
                      style={{ ...inputStyle, fontSize: 14, marginBottom: 8 }}
                      placeholder="Caption..."
                    />

                  </div>
                )}

                <button
                  onClick={() => removeBlock(sectionIndex, blockIndex)}
                  style={{
                    marginTop: 8,
                    padding: "4px 12px",
                    background: "transparent",
                    color: "#dc2626",
                    border: "1px solid #dc2626",
                    borderRadius: "var(--radius-1)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Remove block
                </button>
              </div>
            ))}

            {/* Add block buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["paragraph", "list", "link", "media"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => addBlock(sectionIndex, type)}
                  style={{
                    padding: "6px 12px",
                    background: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: "var(--radius-1)",
                    cursor: "pointer",
                    fontSize: 12,
                    textTransform: "capitalize",
                  }}
                >
                  + {type}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addSection}
          style={{
            padding: "12px 24px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-1)",
            cursor: "pointer",
          }}
        >
          + Add Section
        </button>
      </div>

      {showJson && (
        <div style={fieldStyle}>
          <label style={labelStyle}>JSON Preview:</label>
          <textarea
            value={JSON.stringify(caseData, null, 2)}
            readOnly
            style={{
              ...inputStyle,
              height: 300,
              fontFamily: "monospace",
              fontSize: 12,
              opacity: 0.7,
            }}
          />
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 14, color: "var(--color-text-muted)" }}>
        Changes are saved directly to GitHub and automatically deployed by Vercel.
      </p>
    </div>
  );
}

function severityRank(severity: DraftQualityIssue["severity"]): number {
  switch (severity) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "info":
      return 2;
    default:
      return 3;
  }
}
