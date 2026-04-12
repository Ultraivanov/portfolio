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

interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
  facts: Fact[];
  sections: Section[];
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
