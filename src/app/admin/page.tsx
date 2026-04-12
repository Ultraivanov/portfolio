"use client";

import { useState, useEffect } from "react";

interface Fact {
  label: string;
  value: string | string[];
}

interface MediaBlock {
  type: "image" | "video" | "embed";
  src: string;
  alt?: string;
  caption?: string;
}

interface Block {
  discriminant: "paragraph" | "list" | "link" | "media";
  value: {
    text?: string;
    items?: string[];
    label?: string;
    url?: string;
    media?: MediaBlock[];
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

export default function AdminPage() {
  const [cases, setCases] = useState<CaseInfo[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [caseData, setCaseData] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageCaption, setImageCaption] = useState("");

  // Load list of cases
  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data: CaseInfo[]) => {
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

  // Load selected case content
  useEffect(() => {
    if (!selectedCase) return;
    fetch(`/api/cases/${selectedCase}`)
      .then((r) => r.json())
      .then((data: CaseStudy) => {
        setCaseData(data);
      })
      .catch(() => {
        setMessage("❌ Failed to load case content");
      });
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

  const handleSave = async () => {
    if (!caseData) return;
    setSaving(true);
    setMessage("");

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

    const result = await response.json();

    if (response.ok) {
      setMessage("✅ Saved! Changes will deploy in ~1 minute.");
    } else {
      setMessage(`❌ Error: ${result.error}`);
    }
    setSaving(false);
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

    const result = await response.json();

    if (response.ok) {
      // Update coverSrc with new path (relative to public)
      const publicPath = path.replace(/^public/, "");
      updateField("coverSrc", publicPath);
      setMessage("✅ Image uploaded!");
      setSelectedFile(null);
      setImageCaption("");
    } else {
      setMessage(`❌ Upload failed: ${result.error}`);
    }
    setUploading(false);
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
      link: { label: "", url: "" },
      media: { media: [{ type: "image", src: "", alt: "", caption: "" }] },
    };
    newSections[sectionIndex].blocks.push({ discriminant: type, value: defaultValue[type] });
    updateField("sections", newSections);
  };

  const removeBlock = (sectionIndex: number, blockIndex: number) => {
    if (!caseData) return;
    const newSections = [...caseData.sections];
    newSections[sectionIndex].blocks = newSections[sectionIndex].blocks.filter((_, i) => i !== blockIndex);
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
          style={{ ...inputStyle, height: 80, fontFamily: "inherit" }}
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
            <input
              type="text"
              value={Array.isArray(fact.value) ? fact.value.join(", ") : fact.value}
              onChange={(e) => updateFact(index, "value", e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="value"
            />
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
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: saving ? "#999" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-1)",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 16,
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

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
                style={{
                  marginBottom: 12,
                  padding: 12,
                  border: "1px dashed var(--color-border-subtle)",
                  borderRadius: "var(--radius-1)",
                  background: "var(--color-bg-secondary)",
                }}
              >
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                  {block.discriminant}
                </div>

                {block.discriminant === "paragraph" && (
                  <textarea
                    value={block.value.text || ""}
                    onChange={(e) => updateBlock(sectionIndex, blockIndex, { text: e.target.value })}
                    style={{ ...inputStyle, height: 100 }}
                    placeholder="Paragraph text..."
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
                      value={block.value.url || ""}
                      onChange={(e) => updateBlock(sectionIndex, blockIndex, { url: e.target.value })}
                      style={{ ...inputStyle, flex: 2 }}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {block.discriminant === "media" && (
                  <div>
                    {(block.value.media || []).map((media, mediaIndex) => (
                      <div key={mediaIndex} style={{ marginBottom: 8 }}>
                        <input
                          type="text"
                          value={media.src}
                          onChange={(e) => {
                            const newMedia = [...(block.value.media || [])];
                            newMedia[mediaIndex] = { ...media, src: e.target.value };
                            updateBlock(sectionIndex, blockIndex, { media: newMedia });
                          }}
                          style={{ ...inputStyle, marginBottom: 4 }}
                          placeholder="Image path..."
                        />
                        <input
                          type="text"
                          value={media.caption || ""}
                          onChange={(e) => {
                            const newMedia = [...(block.value.media || [])];
                            newMedia[mediaIndex] = { ...media, caption: e.target.value };
                            updateBlock(sectionIndex, blockIndex, { media: newMedia });
                          }}
                          style={{ ...inputStyle, fontSize: 14 }}
                          placeholder="Caption..."
                        />
                      </div>
                    ))}
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
