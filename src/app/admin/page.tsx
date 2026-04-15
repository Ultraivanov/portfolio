"use client";

import { useState, useEffect } from "react";

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

const MEDIA_UPLOAD_TIMEOUT_MS = 90_000;

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
    void loadCaseContent(selectedCase);
  }, [selectedCase]);

  const updateField = <K extends keyof CaseStudy>(field: K, value: CaseStudy[K]) => {
    if (!caseData) return;
    setCaseData({ ...caseData, [field]: value });
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
      setMessage("⏳ Дождитесь завершения загрузки медиа перед сохранением.");
      return;
    }

    const error = validateCase(caseData);
    if (error) {
      setMessage(`❌ ${error}`);
      return;
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

  const handleUpload = async () => {
    if (!selectedFile || !caseData) return;
    setUploading(true);
    setMessage("");

    const ext = selectedFile.name.split(".").pop();
    const path = `public/cases/${selectedCase}/${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("path", path);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as UploadApiResponse;

    if (response.ok) {
      // Update coverSrc with new path (relative to public)
      const publicPath = path.replace(/^public/, "");
      updateField("coverSrc", publicPath);
      const sizeDelta = formatUploadSizeDelta(result.size);
      setMessage(`✅ Image uploaded${sizeDelta ? ` (${sizeDelta})` : ""}`);
      setSelectedFile(null);
      setImageCaption("");
    } else {
      setMessage(`❌ Upload failed: ${getApiErrorMessage(result)}`);
    }
    setUploading(false);
  };

  // Upload image for media block
  const handleUploadMediaImage = async (
    sectionIndex: number,
    blockIndex: number,
    file: File
  ) => {
    if (!caseData || !file) return;
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

      let result: UploadApiResponse = {};
      try {
        result = (await response.json()) as UploadApiResponse;
      } catch {
        result = {};
      }

      if (response.ok) {
        const publicPath = path.replace(/^public/, "");
        const currentAlt = caseData.sections[sectionIndex]?.blocks[blockIndex]?.value.alt?.trim();
        const nextAlt = currentAlt || deriveAltFromFileName(file.name);
        updateBlock(sectionIndex, blockIndex, { src: publicPath, alt: nextAlt });
        const sizeDelta = formatUploadSizeDelta(result.size);
        setMessage(`✅ Image uploaded to media block${sizeDelta ? ` (${sizeDelta})` : ""}`);
        const processedText = result.svgOptimization
          ? result.svgOptimization.optimized
            ? "SVG оптимизирован"
            : "SVG проверен без изменений"
          : "Файл обработан";
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

      const apiError = getApiErrorMessage(result);
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
      setMessage(`❌ Upload failed: ${message}`);
      setMediaUploadFeedbackByBlock((prev) => ({
        ...prev,
        [blockKey]: {
          fileName: file.name,
          uploading: false,
          uploaded: false,
          errorText: message,
        },
      }));
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
            Defaults to "{caseData.title} | Dmitry Ginzburg" if empty
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
                              Загружен{feedback.fileName ? `: ${feedback.fileName}` : ""}
                            </div>
                            <div>
                              {feedback.sizeText ? "✅" : "⬜"} Вес
                              {feedback.sizeText ? `: ${feedback.sizeText}` : ""}
                            </div>
                            <div>
                              {feedback.processedText ? "✅" : "⬜"} Обработан
                              {feedback.processedText ? `: ${feedback.processedText}` : ""}
                            </div>
                            {feedback.errorText ? (
                              <div style={{ color: "#f87171" }}>❌ Ошибка: {feedback.errorText}</div>
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
